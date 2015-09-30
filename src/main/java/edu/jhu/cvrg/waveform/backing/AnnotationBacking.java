package edu.jhu.cvrg.waveform.backing;
/**
 * CONTROLLER of the MVC for the LogonScreen Migration SA 10/25.
 * 
 * @author salger2 aka Scott Alger 
 * 
 */
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
/**
* @author Scott Alger 2013, Chris Jurado, Brandon Bennetz, Mike Shipway
* 
*/
import java.io.Serializable;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.PostConstruct;
import javax.faces.application.FacesMessage;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.ManagedProperty;
import javax.faces.bean.ViewScoped;
import javax.faces.context.FacesContext;
import javax.faces.event.ActionEvent;

import org.primefaces.context.RequestContext;

import edu.jhu.cvrg.data.dto.AnnotationDTO;
import edu.jhu.cvrg.data.dto.DocumentRecordDTO;
import edu.jhu.cvrg.data.factory.ConnectionFactory;
import edu.jhu.cvrg.data.util.DataStorageException;
import edu.jhu.cvrg.waveform.utility.ResourceUtility;
import edu.jhu.cvrg.waveform.utility.ServiceProperties;
import edu.jhu.cvrg.waveform.utility.WebServiceUtility;

@ViewScoped
@ManagedBean(name="annotationBacking")
public class AnnotationBacking extends BackingBean implements Serializable {

	private static final long serialVersionUID = -6719393176698520013L;

	public int leadnum;
    private String leadName;
    
    private int annotationCount=0;
	private int flagCount = 0;
	private char cIntervalLabel = 'A';
	
	private AnnotationDTO annotation;
	
	@ManagedProperty("#{visualizeSharedBacking}")
	private VisualizeSharedBacking visualizeSharedBacking;   
	
	
	/** 
	 * sets up and calls showAnnotations() which retrieves annotations for the given lead, and executes the JavaScript functions which clear and then set the annotations on the Dygraph.<BR/>
	 * The executed JavaScript includes:  CVRG_resetAnnotations(), CVRG_addAnnotationHeight(), CVRG_addAnnotationInterval().
	 **/
	@PostConstruct
	public void init(){
		this.getLog().info("***  New instance ****");
		setLeadName(visualizeSharedBacking.getSelectedLeadName());
		setLeadnum(Integer.parseInt(visualizeSharedBacking.getSelectedLeadNumber()));
		
		//create a copy of the selected annotation to permit changes with security. 
		annotation = this.getVisualizeSharedBacking().getSessionAnn().clone();
		
		showNewAnnotationForLead();
	}
	
	public void updateAnnotationInterval(){

    	FacesContext context = FacesContext.getCurrentInstance();
		Map<String, String> map = context.getExternalContext().getRequestParameterMap();
		
		String passedDataOnsetX = (String) map.get("DataOnsetX");
		String passedDataOnsetY = (String) map.get("DataOnsetY");
		String passedDataOffsetX = (String) map.get("DataOffsetX");
		String passedDataOffsetY = (String) map.get("DataOffsetY");
		
		this.getAnnotation().setStartXcoord(Double.parseDouble(passedDataOnsetX));
		this.getAnnotation().setStartYcoord(Double.parseDouble(passedDataOnsetY));
		this.getAnnotation().setEndXcoord(Double.parseDouble(passedDataOffsetX));
		this.getAnnotation().setEndYcoord(Double.parseDouble(passedDataOffsetY));
		
		this.getLog().info("+++ AnnotationBacking.java, viewAnnotationInterval() passedDataOnsetX:  " + passedDataOnsetX + "   passedDataOnsetY: " + passedDataOnsetY + " +++ ");
		this.getLog().info("+++ ++++++++++++++++++++++++++++++++++++++++++++++++ passedDataOffsetX: " + passedDataOffsetX + " passedDataOffsetY: " + passedDataOffsetY + " +++ ");
		this.getLog().info("+++ ++++++++++++++++++++++++++++++++++++++++++++++++ dataSXDuration:    " + this.getAnnotation().getDataXChange() + "  dataSYDuration: " + this.getAnnotation().getDataYChange() + " +++ ");
		
		showNewAnnotationForLead();
    }
	
	public void updateSelectedPoint(){
		FacesContext context = FacesContext.getCurrentInstance();
		Map<String, String> map = context.getExternalContext().getRequestParameterMap();
		
		Integer fineTuningPonit = Integer.valueOf((String) map.get("fineTuningPoint"));
		String x = (String) map.get("X");
		String y = (String) map.get("Y");
		
		if(fineTuningPonit != null && fineTuningPonit >= 0){
			if(fineTuningPonit == 0){
				
				this.getAnnotation().setStartXcoord(Double.parseDouble(x));
				this.getAnnotation().setStartYcoord(Double.parseDouble(y));
				
				if(this.getVisualizeSharedBacking().getSessionAnn().isSinglePoint()){
					this.getAnnotation().setEndXcoord(Double.parseDouble(x));
					this.getAnnotation().setEndYcoord(Double.parseDouble(y));
				}
				
			}else if(fineTuningPonit == 1){ 
				this.getAnnotation().setEndXcoord(Double.parseDouble(x));
				this.getAnnotation().setEndYcoord(Double.parseDouble(y));
			}
		}
		showNewAnnotationForLead();
	}
	
	public void discardSelectedPoint(){
		FacesContext context = FacesContext.getCurrentInstance();
		Map<String, String> map = context.getExternalContext().getRequestParameterMap();
		
		Integer fineTuningPonit = Integer.valueOf((String) map.get("fineTuningPoint"));
		
		if(fineTuningPonit != null && fineTuningPonit >= 0){
			if(fineTuningPonit == 0){
				this.getAnnotation().setStartXcoord(this.getVisualizeSharedBacking().getSessionAnn().getStartXcoord());
				this.getAnnotation().setStartYcoord(this.getVisualizeSharedBacking().getSessionAnn().getStartYcoord());
				
				if(this.getVisualizeSharedBacking().getSessionAnn().isSinglePoint()){
					this.getAnnotation().setEndXcoord(this.getVisualizeSharedBacking().getSessionAnn().getEndXcoord());
					this.getAnnotation().setEndYcoord(this.getVisualizeSharedBacking().getSessionAnn().getEndYcoord());
				}
				
			}else if(fineTuningPonit == 1){ 
				this.getAnnotation().setEndXcoord(this.getVisualizeSharedBacking().getSessionAnn().getEndXcoord());
				this.getAnnotation().setEndYcoord(this.getVisualizeSharedBacking().getSessionAnn().getEndYcoord());
			}
		}
		showNewAnnotationForLead();
	}
    
    /** Switches to the selection tree and list view.
     * Handles onclick event for the button "btnView12LeadECG" in the viewA_SelectionTree.xhtml view.
     * 
     */
    public String viewSingleGraph(){
    	this.getLog().info("*** AnnotationBack.java, viewSingleGraph() ***");
		return "viewD_SingleLead";
    }


	public void showNodeID(){
		
		String key = "definition";
		
		Map<String, String> saOntDetail =  WebServiceUtility.lookupOntology(this.getAnnotation().getBioportalOntology(), this.getAnnotation().getBioportalClassId(), key); // ECGTermsv1:ECG_000000103 
		
		this.getAnnotation().setValue(saOntDetail.get(key));
		
		this.getLog().info("*** showNodeID(), nodeID: \"" + this.getAnnotation().getBioportalClassId() + "\"");
		this.getLog().info("*** showNodeID(), FullAnnotation: \"" + this.getAnnotation().getValue() + "\"");
	     
     	Map<String, Object> data = new HashMap<String, Object>();
     	String dataFullAnnotation = this.getAnnotation().getValue();
        
     	data.put("*", dataFullAnnotation);
	}
	
	public void lookupDefinition(){
		this.getLog().info("*** AnnotationBackup.lookupDefinition() ***");
    	FacesContext context = FacesContext.getCurrentInstance();
		Map<String, String> map = context.getExternalContext().getRequestParameterMap();
		
		String ontologyID = (String) map.get("ontologyID");
		String passedNodeID = (String) map.get("nodeID");
		
		this.getAnnotation().setBioportalOntology(ontologyID); // e.g. "48037"
		try {
			this.getAnnotation().setBioportalClassId(URLDecoder.decode(passedNodeID, "UTF-8"));
		} catch (UnsupportedEncodingException e) {
			this.getAnnotation().setBioportalClassId(passedNodeID);
		}
		
		Map<String, String> saOntDetail =  WebServiceUtility.lookupOntology(ontologyID, passedNodeID,  "definition", "prefLabel"); // http://data.bioontology.org/ontologies/ECGT/classes/http%3A%2F%2Fwww.cvrgrid.org%2Ffiles%2FECGTermsv1.owl%23ECG_000000477
		this.getAnnotation().setValue(saOntDetail.get("definition")); // e.g. "The peak of the R Wave."
		this.getAnnotation().setName(saOntDetail.get("prefLabel"));
		
		this.getLog().info("*** -- nodeID: \"" + this.getAnnotation().getBioportalClassId() + "\"");
		this.getLog().info("*** -- FullAnnotation: \"" + this.getAnnotation().getValue() + "\"");
	     
	}
	
	
	/** 
	 * Sets the dygraphs flag inplace carrys the x and y info and fills these values with the user input data for each lead annotation.
	 *   termName, getLeadName, dataSY, dataSX, getFullAnnotation
	 */
	public void saveAnnotationSetFlag(ActionEvent actionEvent) {
		RequestContext context = RequestContext.getCurrentInstance();
		context.addCallbackParam("saved", true);    //basic parameter
		
		//  callBack working
		this.getLog().debug("saveAnnotationSetFlag(), SinglePoint: " + this.getAnnotation().isSinglePoint());
		this.getLog().debug("saveAnnotationSetFlag(), LeadName: " + getLeadName());
		this.getLog().debug("saveAnnotationSetFlag(), leadnum: " + getLeadnum());
		this.getLog().debug("saveAnnotationSetFlag(), getStartYcoord: " + this.getAnnotation().getStartYcoord());
		this.getLog().debug("saveAnnotationSetFlag(), getStartXcoord: " + this.getAnnotation().getStartXcoord());
		this.getLog().debug("saveAnnotationSetFlag(), getEndXcoord: " + this.getAnnotation().getEndXcoord());
		this.getLog().debug("saveAnnotationSetFlag(), getEndYcoord: " + this.getAnnotation().getEndYcoord());			
		this.getLog().debug("saveAnnotationSetFlag(), getDataYChange : " + this.getAnnotation().getDataYChange());
		this.getLog().debug("saveAnnotationSetFlag(), getDataXChange : " + this.getAnnotation().getDataXChange());
		this.getLog().debug("saveAnnotationSetFlag(), getName: " + this.getAnnotation().getName());
		this.getLog().debug("saveAnnotationSetFlag(), getValue: " + this.getAnnotation().getValue());
		this.getLog().debug("saveAnnotationSetFlag(), getBioportalConceptID: " + this.getAnnotation().getBioportalClassId());
		this.getLog().debug("saveAnnotationSetFlag(), getBioportalOntologyID: " + this.getAnnotation().getBioportalOntology());

//			 * Required values that need to be filled in are:
//				 * 
//				 * created by (x) - the source of this annotation (whether it came from an algorithm or was entered manually)
//				 * concept label - the type of annotation as defined in the annotation's bioportal reference term
//				 * annotation ID - a unique ID used for easy retrieval of the annotation in the database
//				 * onset label - the bioportal reference term for the onset position.  This indicates the start point of an interval
//				 * 					or the location of a single point
//				 * onset y-coordinate - the y coordinate for that point on the ECG wave
//				 * onset t-coordinate - the t coordinate for that point on the ECG wave.
//				 * an "isInterval" boolean - for determining whether this is an interval (and thus needs an offset tag)
//		    	 * Full text description - This is the "value" so to speak, and contains the full definition of the annotation type being used
//				 * 
//				 * Note:  If this is an interval, then an offset label, y-coordinate, and t-coordinate are required for that as well.
		
					
		AnnotationDTO ann = new AnnotationDTO(ResourceUtility.getCurrentUserId(),
				 							   visualizeSharedBacking.getSharedStudyEntry().getDocumentRecordId(), "manual", "ANNOTATION", this.getAnnotation().getName(), this.getAnnotation().getBioportalOntology(), this.getAnnotation().getBioportalClassId(), null,
				 							   getLeadnum(), "", this.getAnnotation().getDescription(), this.getAnnotation().getValue(), Calendar.getInstance(),null, null, null, null);
		 
		 if(this.getAnnotation().isSinglePoint()){
			 ann.setStartXcoord(this.getAnnotation().getStartXcoord());
			 ann.setStartYcoord(this.getAnnotation().getStartYcoord());
			 ann.setEndXcoord(this.getAnnotation().getStartXcoord());
			 ann.setEndYcoord(this.getAnnotation().getStartYcoord());
		 }else{
			 ann.setStartXcoord(this.getAnnotation().getStartXcoord());
			 ann.setStartYcoord(this.getAnnotation().getStartYcoord());
			 ann.setEndXcoord(this.getAnnotation().getEndXcoord());
			 ann.setEndYcoord(this.getAnnotation().getEndYcoord());
		 }
		 
		 
		 Long annotationId = null;
		 
		 try {
			annotationId = ConnectionFactory.createConnection().storeAnnotation(ann);
		} catch (DataStorageException e) {
			this.getLog().error("Error on save annotation. "+e.getMessage());
		}
		 
		 if(annotationId == null) {
			 //add facesmessage
			 FacesContext.getCurrentInstance().addMessage(null, new FacesMessage("Failure", "Annotation did not save properly"));
		 }

		 this.getLog().info("saveAnnotationSetFlag(), Complete.");
		
	}


	/** 
	 * Retrieves annotations for the given lead, and executes the JavaScript functions which clear and then set the annotations on the Dygraph.<BR/>
	 * The executed JavaScript includes:  CVRG_resetAnnotations(), CVRG_addAnnotationHeight(), CVRG_addAnnotationInterval().
	 * @param context
	 * @param RetrieveECGDatabase
	 */
	public void showNewAnnotationForLead(){
		this.getLog().info("### showNewAnnotationForLead ###");
		RequestContext context = RequestContext.getCurrentInstance();
		String sErrorMess = "";

		int leadIndex = getLeadnum();
		if(leadIndex == -1) sErrorMess += "lead index is invalid | ";
		if(this.getVisualizeSharedBacking().getSharedStudyEntry() ==  null) sErrorMess += "visualizeSharedBacking.getSharedStudyEntry() is invalid | ";

		if(sErrorMess.length() > 0){
			this.getLog().error("AnnotationBacking.java, showNewAnnotation() failed: " + sErrorMess);
		}else{
			AnnotationDTO newAnnotation = new AnnotationDTO();
			newAnnotation.setStartXcoord(this.getAnnotation().getStartXcoord());
			newAnnotation.setStartYcoord(this.getAnnotation().getStartYcoord());
			newAnnotation.setValue(this.getAnnotation().getValue());
			newAnnotation.setName(this.getLeadName());

			if(!this.getAnnotation().isSinglePoint()){
				newAnnotation.setEndXcoord(this.getAnnotation().getEndXcoord());
				newAnnotation.setEndYcoord(this.getAnnotation().getEndYcoord());
			}else{
				newAnnotation.setEndXcoord(this.getAnnotation().getStartXcoord());
				newAnnotation.setEndYcoord(this.getAnnotation().getStartYcoord());
			}
			this.getLog().debug("### ### isSinglePoint: " + newAnnotation.isComment() 
						+ " getDataOffsetX(): " + newAnnotation.getEndXcoord()
						+ " getDataOffsetY(): " + newAnnotation.getEndYcoord());
			

			context.execute("CVRG_resetAnnotations()");
			context.execute("WAVEFORM_clearHighLightQueue()");

			String series = getLeadName();


			HashMap<Double, Integer> duplicates = new HashMap<Double, Integer>();
			flagCount = 0;
			cIntervalLabel = 'A';

			duplicates = addAnnotation(context, series, newAnnotation, duplicates);
		}
	}

	public void showNewAnnotationGraph(){
		this.getLog().info("*** showNewAnnotationGraph()");
		visualizeSharedBacking.setShowFineGraph(true);
	}
	public void showNewAnnotationDetails(){
		this.getLog().info("*** showNewAnnotationDetails()");
		visualizeSharedBacking.setShowFineGraph(false);
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
		String ontologyId = ""; //e.g. = "Amplitude";
		String fullAnnotation = "";//
		Long annotationID;
		this.getLog().debug("### ### addAnnotation() -- isSinglePoint: " + singleAnnotation.isSinglePoint() 
				+ " isComment: " + singleAnnotation.isComment()
				+ " getDataOffsetX(): " + singleAnnotation.getEndXcoord()
				+ " getDataOffsetY(): " + singleAnnotation.getEndYcoord());

		firstX = (long) singleAnnotation.getStartXcoord().longValue();	// time or "X" coordinate 
		firstY = (long) singleAnnotation.getStartYcoord().longValue();	//voltage or "Y" coordinate, not needed for dygraph annotation flag, but might be used by our code later.

		if(singleAnnotation.getName() != null){
			ontologyId = singleAnnotation.getName();	
		}
		
		if(singleAnnotation.getValue() != null){
			fullAnnotation = singleAnnotation.getValue();
		}
		
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
					+ flagLabel + "','" + ontologyId + "','" + fullAnnotation  + "',' " 
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
	
	
	public Double getOnSet(){
		return convertToExpValue(this.getAnnotation().getStartXcoord());
	}

	public Double getOffSet(){
		return convertToExpValue(this.getAnnotation().getEndXcoord());
	}
	
	private Double convertToExpValue(Double x) {
		if(x != null){
			int expSec = this.getAnnotation().getExpTimeInSec();
			if(expSec > 0){
				return (x/1000)/Math.pow(10, expSec);
			}else{
				return (x/1000);
			}
		}
		return null;
	}
	
	
	public DocumentRecordDTO getStudyEntry(){
		return visualizeSharedBacking.getSharedStudyEntry();
	}
	
    public VisualizeSharedBacking getVisualizeSharedBacking() {
		return visualizeSharedBacking;
	}

	public void setVisualizeSharedBacking(VisualizeSharedBacking visualizeSharedBacking) {
		this.visualizeSharedBacking = visualizeSharedBacking;
	}

	public void setLeadName(String leadName) {
		this.leadName = leadName;
	}

	public String getLeadName() {
		return leadName;
	}

	public int getLeadnum() {
		return leadnum;
	}

	public void setLeadnum(int leadnum) {
		this.leadnum = leadnum;
	}

	public int getAnnotationCount() {
		return annotationCount;
	}

	public AnnotationDTO getAnnotation() {
		return annotation;
	}
	
	public String getBioportalExternalLink(){
		return AnnotationDTO.generateURL(this.getAnnotation().getBioportalOntology(), this.getAnnotation().getBioportalClassId());
	}

	public String getBioportalClassId(){
		return this.getAnnotation().getBioportalClassId() != null ? '\''+this.getAnnotation().getBioportalClassId()+'\'' : "null";
	}
	
	public String getBioportalOntology(){
		return this.getAnnotation().getBioportalOntology() != null ? this.getAnnotation().getBioportalOntology() : AnnotationDTO.ECG_TERMS_ONTOLOGY;
	}
	
	public String getBioportalAPIUrl(){
		return ServiceProperties.getInstance().getBioportalAPIServerURL();
	}
	
	public String getBioportalUIUrl(){
		return ServiceProperties.getInstance().getBioportalUIServerURL();
	}
	
	public String getBioportalApikey(){
		return ServiceProperties.getInstance().getBioportalApikey();
	}
	
}
