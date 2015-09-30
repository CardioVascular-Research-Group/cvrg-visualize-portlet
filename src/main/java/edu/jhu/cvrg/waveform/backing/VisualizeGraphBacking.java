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
/**
* @author Chris Jurado, Scott Alger, Mike Shipway
* 
*/
import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.ManagedProperty;
import javax.faces.bean.ViewScoped;
import javax.faces.context.FacesContext;

import edu.jhu.cvrg.data.dto.AnnotationDTO;
import edu.jhu.cvrg.data.dto.DocumentRecordDTO;
import edu.jhu.cvrg.data.factory.ConnectionFactory;
import edu.jhu.cvrg.data.util.DataStorageException;
import edu.jhu.cvrg.waveform.model.MultiLeadLayout;
import edu.jhu.cvrg.waveform.utility.ResourceUtility;

@ViewScoped
@ManagedBean(name = "visualizeGraphBacking")
public class VisualizeGraphBacking extends BackingBean implements Serializable {

	@ManagedProperty("#{visualizeSharedBacking}")
	private VisualizeSharedBacking visualizeSharedBacking;
	
	private static final long serialVersionUID = -3657756514965814260L;
	
	private ArrayList<MultiLeadLayout> multiLeadLayoutList;
	
	private int multiLeadColumnCount = 5; //default value
	
	@PostConstruct
	public void init() {
		this.getLog().info("*************** VisualizeGraphBacking.java, initialize() **********************");
		//set the default duration 
		visualizeSharedBacking.setDurationMilliSeconds(2500);
    	viewMultiLeadGraph();
    	populateWholeECGAnnotations();
    	this.getLog().info("*************** DONE, initialize() **********************");
	}

    /** Switches to the selection tree and list view.
     * Handles onclick event for the button "btnView12LeadECG" in the viewA_SelectionTree.xhtml view.
     * 
     */
    public String viewSingleGraph2(){
    	FacesContext context = FacesContext.getCurrentInstance();
		Map<String, String> map = context.getExternalContext().getRequestParameterMap();
		String passedLeadName = (String) map.get("sLeadName");
		String passedLeadNumber = (String) map.get("sLeadNumber");
		
		visualizeSharedBacking.setSelectedLeadName(passedLeadName);
		visualizeSharedBacking.setSelectedLeadNumber(passedLeadNumber);
		// Multi lead displays always start at zero seconds (0 ms).
		visualizeSharedBacking.setCurrentVisualizationOffset(0); 
		
		this.getLog().info("+++ VisualizeGraphBacking.java, viewSingleGraph2() passedLeadName: " + passedLeadName + " passedLeadNumber: " + passedLeadNumber + " +++ ");
		visualizeSharedBacking.setGraphMultipleVisible(false);
		return "viewD_SingleLead";
    }

    /** Loads the data for the selected ecg file and switches to the 12 lead graph panel.
     * Handles onclick event for the button "btnView12LeadECG" in the viewA_SelectionTree.xhtml view.
     * 
     */
    public String viewMultiLeadGraph(){
    	this.getLog().info("+ VisualizeGraphBacking.java, viewMultiLeadGraph() +++ ");
    	
		if(visualizeSharedBacking.getSharedStudyEntry() != null){
			
			int iLeadCount = visualizeSharedBacking.getSharedStudyEntry().getLeadCount();
			if(visualizeSharedBacking.getData() == null){
				iLeadCount = visualizeSharedBacking.fetchDisplayData();	
			}
			
			visualizeSharedBacking.setCurrentVisualizationOffset(0);
			setMultiLeadLayoutList( getMultiLeadLayout(iLeadCount) );
			int iaAnnCount[][] = fetchAnnotationArray();
			visualizeSharedBacking.setGraphTitle(iaAnnCount, iLeadCount);
		}
		this.getLog().info("+ Exiting viewMultiLeadGraph() +++ ");
		visualizeSharedBacking.setGraphMultipleVisible(true);
		return "viewB_DisplayMultiLeads";
    }
    
    public String getDescription() {
    	String description = "Subject:" + visualizeSharedBacking.getSharedStudyEntry().getRecordName() 
    			+ " / Lead count:" + visualizeSharedBacking.getSharedStudyEntry().getLeadCount() 
    			+ " / Sampling-rate:" + visualizeSharedBacking.getSharedStudyEntry().getSamplingRate() + "Hz"
    			+ " / ECG duration:" + visualizeSharedBacking.getSharedStudyEntry().getDurationSec();
		return description;
	}
    
	public void setGraphedStudyEntry(DocumentRecordDTO selectedStudyObject) {this.visualizeSharedBacking.setSharedStudyEntry(selectedStudyObject);}
	public DocumentRecordDTO getGraphedStudyEntry() {return visualizeSharedBacking.getSharedStudyEntry();}

	/** Fetch an array of all annotations on this ECG.
	 * 
	 * @return
	 */
	private int[][] fetchAnnotationArray(){
		this.getLog().info("--- fetchAnnotationArray()----");
		int iaAnnCount[][] = null;
		try {
			if(visualizeSharedBacking.getSharedStudyEntry() != null){
				
				Long docId = visualizeSharedBacking.getSharedStudyEntry().getDocumentRecordId();
				Integer leadCount = visualizeSharedBacking.getSharedStudyEntry().getLeadCount();
				
				iaAnnCount = ConnectionFactory.createConnection().getAnnotationCountPerLead(docId, leadCount);
				
			}else{
				this.getLog().error("--- fetchAnnotationArray() SharedStudyEntry not found.");
			}
			this.getLog().info("--- exiting fetchAnnotationArray()");
		} catch (Exception e) {
			this.getLog().error("Localized message: " + e.getLocalizedMessage());
			this.getLog().error("Detailed error message: " + e.getMessage());
			e.printStackTrace();
		}
		return iaAnnCount;
	}

	public int getMultiLeadColumnCount(){
		return multiLeadColumnCount;
	}
	public void setMultiLeadColumnCount(int count){
		this.multiLeadColumnCount = count;
	}
	
	public ArrayList<MultiLeadLayout> getMultiLeadLayoutList() {
		return multiLeadLayoutList;
	}
	public void setMultiLeadLayoutList(ArrayList<MultiLeadLayout> multiLeadLayoutList) {
		this.multiLeadLayoutList = multiLeadLayoutList;
	}

	private ArrayList<MultiLeadLayout> getMultiLeadLayout(int leadCount){
		
		if(leadCount < 4){
			setMultiLeadColumnCount(leadCount+1);
		}else if(leadCount < 10){
			setMultiLeadColumnCount(4);
		}else{
			setMultiLeadColumnCount(5);
		}
		
		ArrayList<MultiLeadLayout> alLayoutList = new ArrayList<MultiLeadLayout>();
		int iRowCount = (int) (new BigDecimal((double)leadCount/(this.getMultiLeadColumnCount()-1))).setScale(0, RoundingMode.UP).intValue();  // rows always start with a calibration column, so data column count is one less.
		for(int row=0;row<iRowCount;row++){
			String debug = "layout row: " + row;
			for(int col=0;col<this.getMultiLeadColumnCount();col++){
				MultiLeadLayout layout = null;
				if(col ==  0){
					// this is a calibration column
					layout = new MultiLeadLayout();
					layout.setLead(false);
					layout.setLeadNumber(row);
					debug += " cal"+ row;
				}else if(row + ((col-1)*iRowCount) < leadCount){
					// this is a lead data column
					layout = new MultiLeadLayout();
					layout.setLead(true);
					layout.setLeadNumber(row + ((col-1)*iRowCount));
					debug += ", L#"+ layout.getLeadNumber();
				}
				if(layout!= null){
					alLayoutList.add(layout);
				}
			}
			this.getLog().debug(debug);
		}
		return alLayoutList;
	}
	
	
	
	public VisualizeSharedBacking getVisualizeSharedBacking() {
		return visualizeSharedBacking;
	}

	public void setVisualizeSharedBacking(VisualizeSharedBacking visualizeSharedBacking) {
		this.visualizeSharedBacking = visualizeSharedBacking;
	}
	
	public int getCalibrationCount(){
		return (new BigDecimal((double)this.getGraphedStudyEntry().getLeadCount()/(this.getMultiLeadColumnCount()-1))).setScale(0, RoundingMode.UP).intValue();
				
	}
	
	private void populateWholeECGAnnotations(){
		
		List<AnnotationDTO> retrievedAnnotationList = null;
		
		try {
			retrievedAnnotationList = ConnectionFactory.createConnection().getLeadAnnotationNode(ResourceUtility.getCurrentUserId(), visualizeSharedBacking.getSharedStudyEntry().getDocumentRecordId(), null);
		} catch (DataStorageException e) {
			this.getLog().error("Error on populate the whole lead annotations. " + e.getMessage());
		}
		
		visualizeSharedBacking.setWholeEcgAnnotations(retrievedAnnotationList);
		
	}

}
