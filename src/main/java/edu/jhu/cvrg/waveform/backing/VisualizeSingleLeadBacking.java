package edu.jhu.cvrg.waveform.backing;

/*
Copyright 2013 Johns Hopkins University Institute for Computational Medicine

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import javax.annotation.PostConstruct;
import javax.faces.application.FacesMessage;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.ManagedProperty;
import javax.faces.bean.ViewScoped;
import javax.faces.context.FacesContext;

import org.primefaces.context.RequestContext;

import com.liferay.portal.model.User;

import edu.jhu.cvrg.data.dto.AnnotationDTO;
import edu.jhu.cvrg.data.dto.DocumentRecordDTO;
import edu.jhu.cvrg.data.factory.ConnectionFactory;
import edu.jhu.cvrg.data.util.DataStorageException;
import edu.jhu.cvrg.waveform.utility.ResourceUtility;

/**
 * CONTROLLER of the MVC for the Single lead Screen
 * 
 * @author Andre Vilardo 2014, Chris Jurado, Brandon Bennetz, Mike Shipway
 * 
 */
@ViewScoped
@ManagedBean(name="singleLeadBacking")
public class VisualizeSingleLeadBacking extends BackingBean implements Serializable {

	private static final long serialVersionUID = -6719393176698520013L;

	private int annotationCount=0;
	
	private int flagCount = 0;
	private char cIntervalLabel = 'A';
	
	
	private List<AnnotationDTO> wholeLeadAnnotations; 
	
	@ManagedProperty("#{visualizeSharedBacking}")
	private VisualizeSharedBacking visualizeSharedBacking;   
	
	
	/** 
	 * sets up and calls showAnnotations() which retrieves annotations for the given lead, and executes the JavaScript functions which clear and then set the annotations on the Dygraph.<BR/>
	 * The executed JavaScript includes:  CVRG_resetAnnotations(), CVRG_addAnnotationHeight(), CVRG_addAnnotationInterval().
	 **/
	@PostConstruct
	public void init(){
		this.getLog().info("***  New instance ****");
		showAnnotations();
		this.getVisualizeSharedBacking().setAnnotationCount(annotationCount);
	}

	/** 
	 * Retrieves annotations for the given lead, and executes the JavaScript functions which clear and then set the annotations on the Dygraph.<BR/>
	 * The executed JavaScript includes:  CVRG_resetAnnotations(), CVRG_addAnnotationHeight(), CVRG_addAnnotationInterval().
	 * @param context
	 * @param RetrieveECGDatabase
	 */
	private void showAnnotations() {
		User userLifeRayModel = ResourceUtility.getCurrentUser();
		String sErrorMess = "";

		int leadIndex = this.getLeadIndex();
		if(leadIndex == -1) sErrorMess += "lead index is invalid | ";
		if(userLifeRayModel ==  null) sErrorMess += "userLifeRayModel is invalid | ";
		if(visualizeSharedBacking.getSharedStudyEntry() ==  null) sErrorMess += "visualizeSharedBacking.getSharedStudyEntry() is invalid | ";

		if(sErrorMess.length() > 0){
			this.getLog().error("AnnotationBacking.java, showAnnotations() failed: " + sErrorMess);
		}else{
			
			List<AnnotationDTO> retrievedAnnotationList = null;
			
			try {
				retrievedAnnotationList = ConnectionFactory.createConnection().getLeadAnnotationNode(userLifeRayModel.getUserId(), visualizeSharedBacking.getSharedStudyEntry().getDocumentRecordId(), leadIndex);
			} catch (DataStorageException e) {
				this.getLog().error("Error on load the lead's annotations. "+e.getMessage());
			}

			if(retrievedAnnotationList != null){
				annotationCount = retrievedAnnotationList.size();
			}else{
				annotationCount = 0;
			}
			
			RequestContext context = RequestContext.getCurrentInstance();
			
			context.execute("CVRG_resetAnnotations()");
			context.execute("WAVEFORM_clearHighLightQueue()");
			
			flagCount = 0;
			cIntervalLabel = 'A';
			
			if(retrievedAnnotationList != null){
				String series = this.getLeadName();
				HashMap<Double, Integer> duplicates = new HashMap<Double, Integer>();
				wholeLeadAnnotations = new ArrayList<AnnotationDTO>();
				
				for (AnnotationDTO annotationDTO : retrievedAnnotationList) {
					if(!annotationDTO.isWholeLead()){
						duplicates = this.addAnnotation(context, series, annotationDTO, duplicates);	
					}else{
						wholeLeadAnnotations.add(annotationDTO);
					}
				}
			}
			
			if(visualizeSharedBacking.getWholeEcgAnnotations() != null){
				if(wholeLeadAnnotations != null){
					wholeLeadAnnotations.addAll(visualizeSharedBacking.getWholeEcgAnnotations());
				}else{
					wholeLeadAnnotations = new ArrayList<AnnotationDTO>(visualizeSharedBacking.getWholeEcgAnnotations());
				}	
			}
			
		}
	}

	
	
	/** Adds a single annotation to the javascript array "tempAnnotations", to be added to the single lead graph after the view page finishes loading.
	 *  The executed JavaScript functions include: CVRG_addAnnotationHeight(), CVRG_addAnnotationInterval().

	 * @param context
	 * @param series
	 * @param singleAnnotation
	 * @param duplicates
	 * @return
	 */
	private HashMap<Double, Integer>  addAnnotation(RequestContext context, String series, AnnotationDTO singleAnnotation, 
													HashMap<Double, Integer> duplicates){
		long firstX;
		long firstY = -999;
		String flagLabel; //e.g. = "1";
		String ontologyId; //e.g. = "Amplitude";
		String fullAnnotation;//
		Long annotationID;
		this.getLog().debug("### ### addAnnotation() -- isSinglePoint: " + singleAnnotation.isSinglePoint() 
				+ " isComment: " + singleAnnotation.isComment()
				+ " getDataOffsetX(): " + singleAnnotation.getEndXcoord()
				+ " getDataOffsetY(): " + singleAnnotation.getEndYcoord());

		firstX = (long) singleAnnotation.getStartXcoord().longValue();	// time or "X" coordinate 
		firstY = (long) singleAnnotation.getStartYcoord().longValue();	//voltage or "Y" coordinate, not needed for dygraph annotation flag, but might be used by our code later.

		ontologyId = singleAnnotation.getName();
		fullAnnotation = singleAnnotation.getValue();
		annotationID = singleAnnotation.getAnnotationId();

		Double xPosition = Double.valueOf(firstX);
		Integer numOccurances = Integer.valueOf(1);

		boolean duplicateCheck = duplicates.containsKey(xPosition);
		int heightMultiplier = 1;

		if(duplicateCheck) {
			numOccurances = duplicates.get(xPosition);
			heightMultiplier = (numOccurances.intValue()) + 1;
			duplicates.put(xPosition, Integer.valueOf(heightMultiplier));
		}
		else {
			duplicates.put(xPosition, Integer.valueOf(heightMultiplier));
		}

		if (fullAnnotation.length()>50){
			String truncatedFull = fullAnnotation.substring(0, 50);
			truncatedFull += "...";
			ontologyId += " - " + truncatedFull;
		}else{
			ontologyId += " - " + fullAnnotation;
		}
	
		if(singleAnnotation.isSinglePoint()) {
			if(firstX != (-999999999)){
				flagLabel = String.valueOf(flagCount+1);   // label of Annotation

				this.getLog().debug("Single point: " + flagLabel + " x: " + firstX);
				int finalHeight = heightMultiplier * 15;
				
				if(singleAnnotation.getDescription() != null){
					fullAnnotation +=( "/" + singleAnnotation.getDescription());
				}
				
				// 	add annotaion from JAVA to JavaScript Dygraph 
				context.execute("CVRG_addAnnotationHeight('" + series + "' , '" +  firstX + "', '" +  firstY + "','" 
					+ flagLabel + "','" + ontologyId + "','" + fullAnnotation + "',' " 
					+ finalHeight + "','" + annotationID + "')");
				flagCount++;
			}
		} else {
			// get Alphabetic flag label, then increment letter.
			String sIntervallabel = String.valueOf(cIntervalLabel);
			cIntervalLabel =  (char) (cIntervalLabel+1);

			int finalHeight = heightMultiplier * -50;
			String flagLabelFirst = sIntervallabel + ">";
			String flagLabelLast = "<" + sIntervallabel;
			
			int width = 30;
			
			long secondX = (long) singleAnnotation.getEndXcoord().longValue();
			long secondY = (long) singleAnnotation.getEndYcoord().longValue();

			long centerX = (long) (( firstX + secondX ) / 2);
			long msSample = (long)(1000/visualizeSharedBacking.getSharedStudyEntry().getSamplingRate()); // milliseconds per sample
			long remainder = centerX % msSample;
			centerX = centerX - remainder;

			// START add annotaion from JAVA to JavaScript Dygraph 
			context.execute("CVRG_addAnnotationInterval('" + series + "' , '" +  firstX + "', '" +  firstY + "','" 
					+ flagLabelFirst + "','" + ontologyId + "','" + fullAnnotation + "',' " 
					+ finalHeight + "','" + width + "','" + annotationID + "')");

			// END X
			context.execute("CVRG_addAnnotationInterval('" + series + "' , '" +  secondX + "', '" +  secondY + "','" 
					+ flagLabelLast + "','" + ontologyId + "','" + fullAnnotation + "',' " 
					+ finalHeight + "','" + width + "','" + annotationID + "')");

			// sets the highlight
			context.execute("WAVEFORM_queueHighLightLocation('" +  firstX + "','" +  firstY + "','" +  finalHeight + "','" +  centerX + "', '" +  secondX + "')");
		}

		//add facesmessage
		FacesContext.getCurrentInstance().addMessage(null, new FacesMessage("Success", "Success"));
		
		return duplicates;
	}
	
	public String getLeadDescription() {
		String leadDescription = "Subject: " + visualizeSharedBacking.getSharedStudyEntry().getSubjectId() + " / Lead: " + getLeadName() + " / Sampling-rate: " + this.getStudyEntry().getSamplingRate()
				+ "Hz / ECG duration: " + this.getStudyEntry().getDurationSec() + " Seconds / " + annotationCount + " annotations." ;
		return leadDescription;
	}

	private int getLeadIndex() {
		return Integer.parseInt(this.getVisualizeSharedBacking().getSelectedLeadNumber());
	}

	private String getLeadName() {
		return this.getVisualizeSharedBacking().getSelectedLeadName();
	}
	
	public DocumentRecordDTO getStudyEntry() {
		return this.getVisualizeSharedBacking().getSharedStudyEntry();
	}

	public void setStudyEntry(DocumentRecordDTO studyEntry) {
		this.getVisualizeSharedBacking().setSharedStudyEntry(studyEntry);
	}

    public VisualizeSharedBacking getVisualizeSharedBacking() {
		return visualizeSharedBacking;
	}

	public void setVisualizeSharedBacking( VisualizeSharedBacking visualizeSharedBacking) {
		this.visualizeSharedBacking = visualizeSharedBacking;
	}

	public int getAnnotationCount() {
		return annotationCount;
	}

	public List<AnnotationDTO> getWholeLeadAnnotations() {
		return wholeLeadAnnotations;
	}

	public void setWholeLeadAnnotations(List<AnnotationDTO> wholeLeadAnnotations) {
		this.wholeLeadAnnotations = wholeLeadAnnotations;
	}

}