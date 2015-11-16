package edu.jhu.cvrg.waveform.backing;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.faces.application.FacesMessage;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.SessionScoped;
import javax.faces.context.FacesContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import edu.jhu.cvrg.data.dto.AnnotationDTO;
import edu.jhu.cvrg.data.dto.DocumentRecordDTO;
import edu.jhu.cvrg.data.dto.FileInfoDTO;
import edu.jhu.cvrg.data.factory.ConnectionFactory;
import edu.jhu.cvrg.data.util.DataStorageException;
import edu.jhu.cvrg.filestore.exception.FSException;
import edu.jhu.cvrg.filestore.main.FileStoreFactory;
import edu.jhu.cvrg.filestore.main.FileStorer;
import edu.jhu.cvrg.filestore.model.FSFile;
import edu.jhu.cvrg.waveform.exception.VisualizeFailureException;
import edu.jhu.cvrg.waveform.main.VisualizationManager;
import edu.jhu.cvrg.waveform.model.VisualizationData;
import edu.jhu.cvrg.waveform.utility.ResourceUtility;
import edu.jhu.cvrg.waveform.utility.ServerUtility;

@SessionScoped
@ManagedBean(name = "visualizeSharedBacking")
public class VisualizeSharedBacking extends BackingBean implements Serializable {
	
	private static final long serialVersionUID = -3526964652221486865L;
	
	private String selectedLeadName="";
	private String selectedLeadNumber="";
	private int currentVisualizationOffset=0;
	private int durationMilliSeconds = 2500; // 2.5 second of data
	private int visualizationWidthMS = 1200;
	private int graphWidthPixels = 1200; //width of the longest graph which will use this data. Sets the maximum amount of data compression allowable.
	private String newMilliSec;
	private JSONObject data = null;
	private boolean graphMultipleVisible = false;

	private String[] saGraphTitle= {"I","II","III","aVR","aVL","aVF","V1","V2","V3","V4","V5","V6","VX","VY","VZ"}; // default values, should be replaced by the this.setGraphTitle() method, though usually the values are the same.
	private DocumentRecordDTO sharedStudyEntry;

	private AnnotationDTO sessionAnn;
	
	private boolean previousAnnotation=false;
    private boolean showFineGraph=false;
	public int annotationCount;
	private List<AnnotationDTO> wholeEcgAnnotations;
	
	private List<String> errorMessages;
	
	/** 
	 * Switches to the selection tree and list view.
     * Handles onclick event for the button "btnView12LeadECG" in the viewA_SelectionTree.xhtml view.
     * 
     */
    public String viewSelectionTree(){
    	return "viewA_SelectionTree";
    }
 
    public String viewMultiLeadGraph(){
    	return "viewB_DisplayMultiLeads";
    }
    
    /** 
     * Refetches the displayed data.  Called if there is a change to the durationMilliSeconds.	 
     * 
     * */
	public void reloadData() {
		this.getLog().info("--Entering function reloadData()");
		
		int maxAllowableOffset = getSharedStudyEntry().getMsecDuration() - durationMilliSeconds + 1; // one graph width before the end of the data.
		if(currentVisualizationOffset > maxAllowableOffset){
			currentVisualizationOffset = maxAllowableOffset; 
		}
		
		try {
			fetchDisplayData();
		} catch (VisualizeFailureException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		this.getLog().info("--Exiting function reloadData()");
	}
	public void panZeroSec() {
		this.getLog().info("--Entering function panZeroSec()");
		panToTime(0);
		this.getLog().info("--Exiting function panZeroSec()");
	}
	public void panRight() {
		this.getLog().info("--Entering function panRight");
		if(isGraphMultipleVisible()){
			panToTime(currentVisualizationOffset + visualizationWidthMS);
		}else{
			panToTime(currentVisualizationOffset + durationMilliSeconds);
		}
		this.getLog().info("--Exiting function panRight");
	}
	public void panLeft() {
		this.getLog().info("--Entering function panLeft");
		if(isGraphMultipleVisible()){
			panToTime(currentVisualizationOffset - visualizationWidthMS);	
		}else{
			panToTime(currentVisualizationOffset - durationMilliSeconds);
		}
		this.getLog().info("--Exiting function panLeft");
	}
	public void panEnd() {
		this.getLog().info("--Entering function panRight");
		int msInFullECG = getSharedStudyEntry().getMsecDuration();  //(int)((NumPts/sampRate)*1000.0); // number of milliseconds in full ECG file.
		panToTime(msInFullECG);
		this.getLog().info("--Exiting function panRight");
	}

	public void panToMilliSec(){
		this.getLog().info("-Entering function panToMilliSec, newMilliSec: \"" + getNewMilliSec() + "\"");
		int iStartPoint = parseToMilliSec(getNewMilliSec());
		if(iStartPoint ==-1){
			String message = "\"" + getNewMilliSec()  + "\" is not a recongnizable number. Please enter seconds in one of the following formats, \"123.45\", \"1.2345e2\" or \"1.2345 x 10^2\" ";
			this.getLog().error("Unable to parse requested new time: "+ message);
		}else{
			if(iStartPoint <= getSharedStudyEntry().getMsecDuration()){
				panToTime(iStartPoint);
			}else{
				String message = iStartPoint + " is too large, this ECG contains " + (getSharedStudyEntry().getMsecDuration()/1000.0) + " seconds";
				this.getLog().error(message);
			}
		}
		this.getLog().info("-Exiting function panToMilliSec");
	}
	
	private int parseToMilliSec(String newMilliSec){
		int newScrollTimeMS=-1;
		Double newTime = 0.0;
		String sSec2="";
		boolean success =  false;
		try{
			newTime = Double.parseDouble(newMilliSec);
			success = true;
		}catch (NumberFormatException e){ // try to change it from "A.AAA x 10^BB" format to "A.AAAeBB" 
			String expr = "\\s*[xX\\*]\\s*10\\s*\\^\\s*";
			sSec2 = newMilliSec.replaceAll(expr, "e");
			try{
				newTime = Double.parseDouble(sSec2);
				success = true;
			}catch (NumberFormatException e2){
				newScrollTimeMS=-1;
				success = false;
				String message = "\"" + newMilliSec + "\" is not a recongnizable number. Please enter seconds in one of the following formats, \"123.45\", \"1.2345e2\" or \"1.2345 x 10^2\" ";
				this.getLog().error(message);
			}
		}
		if(success){
			newScrollTimeMS = (int) (newTime*1000);
		}
		return newScrollTimeMS;
	}
	
	/** 
	 * Pans display data to the StartPoint specified (in milliseconds).
	 * Adjusts for out-of-range values, then calls fetchDisplayData.
	 * 
	 * @param iStartPoint - new start time of graph data in milliseconds.
	 */
	public void panToTime(int iStartPoint) {
		this.getLog().info("--Entering function panToTime, iStartPoint:" + iStartPoint);
		int msInFullECG = getSharedStudyEntry().getMsecDuration();  //(int)((NumPts/sampRate)*1000.0); // number of milliseconds in full ECG file. 
		int maxAllowableOffset=0;
		
		// don't allow view frame to pan past the end of the data.
		// calculate largest allowable start point.
		if(isGraphMultipleVisible()){
			maxAllowableOffset = msInFullECG - visualizationWidthMS + 1; // one graph width before the end of the data.
		}else{
			maxAllowableOffset = msInFullECG - durationMilliSeconds + 1; // one graph width before the end of the data.			
		}
		// check if starting point is too large.
		if(iStartPoint < maxAllowableOffset){
			currentVisualizationOffset = iStartPoint;
		}else{
			currentVisualizationOffset = maxAllowableOffset; 
		}
		
		//check if starting point is too small.
		if(currentVisualizationOffset<0) currentVisualizationOffset = 0;
		
		try {
			fetchDisplayData();
		} catch (VisualizeFailureException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		this.getLog().info("--Exiting function panToTime");
	}
	
	
	/** Fetch and display the ECG data for the current offset time.
	 * @return - lead count
	 * @throws VisualizeFailureException 
	 */
	protected int fetchDisplayData() throws VisualizeFailureException{
		this.getLog().info("--- fetchDisplayData() with iCurrentVisualizationOffset:" + currentVisualizationOffset + " and iDurationMilliSeconds:" + durationMilliSeconds);
		
		String subjectID = getSharedStudyEntry().getSubjectId();
		double samplingRate = getSharedStudyEntry().getSamplingRate();
		int leadCount = getSharedStudyEntry().getLeadCount();
		int samplesPerChannel = getSharedStudyEntry().getSamplesPerChannel();
		
		//fetch data and print elapsed time.
		long startTime = System.currentTimeMillis();
		
		boolean executeInPortlet = "Portlet".equals(ResourceUtility.getOpenTsdStrategy());
		
		VisualizationData visData = VisualizationManager.fetchSubjectVisualizationData(subjectID, currentVisualizationOffset, durationMilliSeconds, graphWidthPixels, samplingRate, leadCount, samplesPerChannel, getSharedStudyEntry().getLeadNames(), getSharedStudyEntry().getTimeSeriesId(), executeInPortlet, getSharedStudyEntry().getAduGain());
		
		long estimatedTime = System.currentTimeMillis() - startTime;
		this.getLog().info("--- - fetchSubjectVisualizationData() took " + estimatedTime +  " milliSeconds total. Sample Count:" + visData.getECGDataLength() + " Lead Count:" + visData.getECGDataLeads() );
		
		//	Check to see is the The Web Service is returning Data for the User Display.
	    if (visData == null) {
		    FacesContext msgs = FacesContext.getCurrentInstance();  
		    msgs.addMessage(null, new FacesMessage(FacesMessage.SEVERITY_WARN, "The ECG lookup Web Service.", "reports failure!"));
		    this.getLog().error("--- get12leadOnloadCallback WARNING: The  ECG lookup WebService failed! ");
	    } else { 
			String dataForJavaScript = visData.getECGDataSingleString();
			dataForJavaScript = dataForJavaScript.replace("\n", "\\n");
			this.getLog().info("--- get12leadOnloadCallback INFO:  dataForJavaScript.length: [" + dataForJavaScript.length() + "]");
			try {
				data = new JSONObject();
				data.put("ECG", dataForJavaScript);
				data.put("minTime", new Integer(currentVisualizationOffset).toString());
				data.put("maxTime", new Integer(currentVisualizationOffset + visualizationWidthMS).toString());			
			} catch (JSONException e) {
				e.printStackTrace();
			}
	    }
	    
	    this.getLog().info("---Exiting function fetchDisplayData()");
		return visData.getECGDataLeads();
	}

	private Map<String, FSFile> getFileEntriesDocId(Long documentRecordId) {
		
		Map<String, FSFile> ret = null;
		
		List<FileInfoDTO> fileInfoList = null; 
				
		try {
			fileInfoList = ConnectionFactory.createConnection().getECGFilesByDocumentRecordId(documentRecordId);
		} catch (DataStorageException e1) {
			this.getLog().error("Error on retrive the file entries. " + e1.getMessage());
		}
		
		if(fileInfoList!=null){
			ret = new HashMap<String, FSFile>();
			
			String[] args = {String.valueOf(ResourceUtility.getCurrentGroupId()), String.valueOf(ResourceUtility.getCurrentUserId()), String.valueOf(ResourceUtility.getCurrentCompanyId())};
			FileStorer fileStorer = FileStoreFactory.returnFileStore(ResourceUtility.getFileStorageType(), args);
			
			for (FileInfoDTO fileDTO : fileInfoList) {
				try {
					FSFile file = fileStorer.getFile(fileDTO.getFileEntryId(), false);
					if(file != null && ".hea.dat.xyz".contains(file.getExtension())){
						ret.put(file.getName(), file);	
					}
				} catch (FSException e) {
					e.printStackTrace();
				} 
			}
		}
		
		return ret;
	}
	
	
	/* - START - Methods moved from AnnotationBacking, to have only one session bean.*/
	
	/** 
	 * Switches to the single annotation creation/editing view.
     * Handles interactionModel.mouseup event (via WAVEFORM3_mouseup() in JavaScript) for the single dygraph in the viewD_SingleLead.xhtml view.
     */
	public String viewAnnotationPoint(){

    	FacesContext context = FacesContext.getCurrentInstance();
		Map<String, String> map = context.getExternalContext().getRequestParameterMap();
		
		double passedDataOnsetX = Double.parseDouble(map.get("DataOnsetX"));
		double passedDataOnsetY = Double.parseDouble(map.get("DataOnsetY"));

		sessionAnn = new AnnotationDTO();
		sessionAnn.setStartXcoord(passedDataOnsetX);
		sessionAnn.setStartYcoord(passedDataOnsetY);
		sessionAnn.setEndXcoord(passedDataOnsetX);
		sessionAnn.setEndYcoord(passedDataOnsetY);
		
		this.getLog().info("+++ AnnotationBacking.java, viewAnnotationPoint() passedDataOnsetX: " + passedDataOnsetX + " passedDataSY: " + passedDataOnsetY + " +++ ");
		
		setShowFineGraph(false);
		setPreviousAnnotation(false);// this is an new annotation, allow editing.
		
		return "viewE_Annotate";
    }
	
    public String viewAnnotationInterval(){

    	FacesContext context = FacesContext.getCurrentInstance();
		Map<String, String> map = context.getExternalContext().getRequestParameterMap();
		
		double passedDataOnsetX = Double.parseDouble(map.get("DataOnsetX"));
		double passedDataOnsetY = Double.parseDouble(map.get("DataOnsetY"));
		double passedDataOffsetX = Double.parseDouble(map.get("DataOffsetX"));
		double passedDataOffsetY = Double.parseDouble(map.get("DataOffsetY"));
		
		sessionAnn = new AnnotationDTO();
		sessionAnn.setStartXcoord(passedDataOnsetX);
		sessionAnn.setStartYcoord(passedDataOnsetY);
		sessionAnn.setEndXcoord(passedDataOffsetX);
		sessionAnn.setEndYcoord(passedDataOffsetY);
		
		this.getLog().info("+++ AnnotationBacking.java, viewAnnotationInterval() passedDataOnsetX:  " + passedDataOnsetX + "   passedDataOnsetY: " + passedDataOnsetY + " +++ ");
		this.getLog().info("+++ ++++++++++++++++++++++++++++++++++++++++++++++++ passedDataOffsetX: " + passedDataOffsetX + " passedDataOffsetY: " + passedDataOffsetY + " +++ ");
		this.getLog().info("+++ ++++++++++++++++++++++++++++++++++++++++++++++++ dataSXDuration:    " + sessionAnn.getDataXChange() + "  dataSYDuration: " + sessionAnn.getDataYChange() + " +++ ");
		
		setShowFineGraph(false);
		setPreviousAnnotation(false);// this is an new annotation, allow editing.
		
		return "viewE_Annotate";
    }
    
    public String viewCurrentAnnotation(){
    	this.getLog().info("+++ AnnotationBacking.java, viewCurrentAnnotation() +++");
    	
    	FacesContext context = FacesContext.getCurrentInstance();
		Map<String, String> map = context.getExternalContext().getRequestParameterMap();
		
		String passedAnnotationID = (String) map.get("annotationID");
		
		try {
			sessionAnn = ConnectionFactory.createConnection().getAnnotationById(ResourceUtility.getCurrentUserId(), Long.valueOf(passedAnnotationID));
		} catch (NumberFormatException e) {
			this.getLog().error("Error, Annotation ID is invalid or is not a number. " + e.getMessage());
		} catch (DataStorageException e) {
			this.getLog().error("Error on load current Annotaion. " + e.getMessage());
		}
		
		setShowFineGraph(false);
		setPreviousAnnotation(true);// this is an existing annotation, do not allow editing.

		return "viewE_Annotate";
    }
	   
    
	public boolean isShowFineGraph() {
		return showFineGraph;
	}

	/** 
	 * Set to true to show fine tuning graph, to false for text details of new annotation.
	 *  
	 * @param showFineGraph
	 */
	public void setShowFineGraph(boolean showFineGraph) {
		this.showFineGraph = showFineGraph;
	}

	public boolean isPreviousAnnotation() {
		return previousAnnotation;
	}

	public void setPreviousAnnotation(boolean previousAnnotation) {
		this.previousAnnotation = previousAnnotation;
	}
	
	/* - END - Methods moved from AnnotationBacking, to have only one session bean.*/
    
    /** 
	 * Creates the titles for the multi-lead graphs.
	 * 
	 * @param iaAnnCount
	 * @param iLeadCount
	 */
	public void setGraphTitle(int[][] iaAnnCount, int iLeadCount){
		this.getLog().info("--- Entering function setGraphTitle()");
		
		String[] leadNames = null;
		if(getSharedStudyEntry().getLeadNames() != null){
			leadNames = this.getSharedStudyEntry().getLeadNames().split(",");
		}
		
		saGraphTitle = new String[iLeadCount+1];
		for(int[] iaACnt: iaAnnCount){
			String sName = null;
			if(leadNames != null){
				sName = leadNames[iaACnt[0]-1];
			}else{
				sName = ServerUtility.guessLeadName(iaACnt[0]-1, iLeadCount);
			}
			if(iaACnt[1] == 0){
				saGraphTitle[iaACnt[0]-1] = sName; // don't mention count when there are zero annotations
			}else{
				saGraphTitle[iaACnt[0]-1] = sName + " (" +  iaACnt[1] + " annotations)";
			}
			this.getLog().debug(iaACnt[0]-1 + ":" + iaACnt[1] + ",");
		}		
		this.getLog().info("--- Exiting function setGraphTitle()");
	}
	
	public JSONArray getGraphTitle() {
		JSONArray jsonArrayTitle = new JSONArray();
		for(String title: saGraphTitle){
			jsonArrayTitle.put(title);
		}
		return jsonArrayTitle;
	}

	public String[] getArrayGraphTitle() {
		return saGraphTitle;
	}

	
	public String getSelectedLeadName() {
		return selectedLeadName;
	}
	public void setSelectedLeadName(String selectedLeadName) {
		this.selectedLeadName = selectedLeadName;
	}
	public String getNewMilliSec() {
		return newMilliSec;
	}

	public void setNewMilliSec(String newMilliSec) {
		this.newMilliSec = newMilliSec;
	}

	public String getSelectedLeadNumber() {
		return selectedLeadNumber;
	}
	public void setSelectedLeadNumber(String selectedLeadNumber) {
		this.selectedLeadNumber = selectedLeadNumber;
	}

	public DocumentRecordDTO getSharedStudyEntry() {
		return sharedStudyEntry;
	}
	public void setSharedStudyEntry(DocumentRecordDTO sharedStudyEntry) {
		this.sharedStudyEntry = sharedStudyEntry;
	}
	public boolean isGraphMultipleVisible() {
		return graphMultipleVisible;
	}
	public void setGraphMultipleVisible(boolean graphMultipleVisible) {
		this.graphMultipleVisible = graphMultipleVisible;
	}
    public String getLeadCount(){
    	return String.valueOf(getSharedStudyEntry().getLeadCount());
    }
    public String getSamplingRate(){
    	return String.valueOf(getSharedStudyEntry().getSamplingRate()) + "Hz";
    }
    public String getDurationSec(){
    	return (getSharedStudyEntry().getDurationSec() + " Seconds");
    }
	public int getCurrentVisualizationOffset() {
		return currentVisualizationOffset;
	}
	public void setCurrentVisualizationOffset(int currentVisualizationOffset) {
		this.currentVisualizationOffset = currentVisualizationOffset;
	}
	public int getDurationMilliSeconds() {
		return durationMilliSeconds;
	}
	public void setDurationMilliSeconds(int durationMilliSeconds) {
		this.durationMilliSeconds = durationMilliSeconds;
	}
	public int getGraphWidthPixels() {
		return graphWidthPixels;
	}
	public void setGraphWidthPixels(int graphWidthPixels) {
		this.graphWidthPixels = graphWidthPixels;
	}
	public JSONObject getData() {
		return data;
	}
	public void setData(JSONObject dataJson) {
		this.data = dataJson;
	}
	public int getVisualizationWidthMS() {
		return visualizationWidthMS;
	}
	public void setVisualizationWidthMS(int visualizationWidthMS) {
		this.visualizationWidthMS = visualizationWidthMS;
	}
	public int getAnnotationCount() {
		return annotationCount;
	}
	public void setAnnotationCount(int annotationCount) {
		this.annotationCount = annotationCount;
	}
	public AnnotationDTO getSessionAnn() {
		return sessionAnn;
	}

	public List<AnnotationDTO> getWholeEcgAnnotations() {
		return wholeEcgAnnotations;
	}

	public void setWholeEcgAnnotations(List<AnnotationDTO> wholeEcgAnnotations) {
		this.wholeEcgAnnotations = wholeEcgAnnotations;
	}
	
	
	public void reset(){
		selectedLeadName="";
		selectedLeadNumber="";
		currentVisualizationOffset=0;
		durationMilliSeconds = 2500; // 2.5 second of data
		visualizationWidthMS = 1200;
		graphWidthPixels = 1200; //width of the longest graph which will use this data. Sets the maximum amount of data compression allowable.
		newMilliSec = "";
		data = null;
		graphMultipleVisible = false;

		saGraphTitle = new String[]{"I","II","III","aVR","aVL","aVF","V1","V2","V3","V4","V5","V6","VX","VY","VZ"}; // default values, should be replaced by the this.setGraphTitle() method, though usually the values are the same.
		sharedStudyEntry = null;

		sessionAnn = null;
		
		previousAnnotation=false;
	    showFineGraph=false;
		annotationCount = 0;
		
	}

	public List<String> getErrorMessages() {
		return errorMessages;
	}

	public void setErrorMessages(List<String> errorMessages) {
		this.errorMessages = errorMessages;
	}
	
	public void addErrorMessage(String message){
		if(errorMessages == null){
			errorMessages = new ArrayList<>();
		}
		errorMessages.add(message);
	}
	
}
