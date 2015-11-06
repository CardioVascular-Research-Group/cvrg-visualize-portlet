package edu.jhu.cvrg.waveform.main;

import java.util.LinkedHashMap;
import java.util.Map;

import org.apache.axiom.om.OMElement;
import org.apache.log4j.Logger;

import edu.jhu.cvrg.waveform.model.VisualizationData;
import edu.jhu.cvrg.waveform.utility.ECGVisualizeProcessor;
import edu.jhu.cvrg.waveform.utility.ResourceUtility;
import edu.jhu.cvrg.waveform.utility.ServerUtility;
import edu.jhu.cvrg.waveform.utility.WebServiceUtility;

/** Contains functions which support the graphing of ECGs.
 * 
 * @author Michael Shipway
 */
public class VisualizationManager {

	public static boolean make12LeadTestPattern=false;
	
	private static final Logger log = Logger.getLogger(VisualizationManager.class);
	
	private VisualizationManager(){		 
		
	}


	/** Calls the collectWFDBdataSegment web service which:<BR>
	 * Reads the file from the file repository (using ftp) and returns a short segment of it as VisualizationData.
	 *
	 * @param userID - needed to look up annotations.
	 * @param subjectID - needed to look up annotations.
	 * @param fileName - file containing the ECG data in RDT format.
	 * @param fileSize - used to size the file reading buffer.
	 * @param offsetMilliSeconds - number of milliseconds from the beginning of the ECG at which to start the graph.
	 * @param durationMilliSeconds - The requested length of the returned data subset, in milliseconds.
	 * @param graphWidthPixels - Width of the zoomed graph in pixels(zoom factor*unzoomed width), hence the maximum points needed in the returned VisualizationData.
	 * @param samplesPerChannel 
	 * @param leadCount 
	 * @param samplingRate 
	 * @param leadNames 
	 * @param double1 
	 * @param callback - call back handler class.
	 * 	 
	 * @return a populated VisualizationData object or <B>null</B> on any web service failure
	 * 
	 * @see org.cvrgrid.ecgrid.client.BrokerService#fetchSubjectVisualization(java.lang.String, java.lang.String, java.lang.String, java.lang.String, java.lang.String, long, int, int)
	 */
	public static VisualizationData fetchSubjectVisualizationData(String subjectID, int offsetMilliSeconds, int durationMilliSeconds, 
																  int graphWidthPixels, double samplingRate, int leadCount, int samplesPerChannel, 
																  String leadNames, String timeseriesId, boolean executeInPortlet, Double adugain) {
		
		log.info("--- -- fetchSubjectVisualizationData() subjectID: " + subjectID +  " offsetMilliSeconds: " + offsetMilliSeconds + " durationMilliSeconds: " + durationMilliSeconds );
		long startTimeFetch = System.currentTimeMillis();
		
		VisualizationData visualizationData = null;
		
		if(!executeInPortlet){
			LinkedHashMap<String, Object> parameterMap = new LinkedHashMap<String, Object>();
			String serviceMethod = "fetchWFDBdataSegmentType2";
			String serviceName = "waveformDataService"; 

			parameterMap.put("timeseriesId", timeseriesId);
			parameterMap.put("leadNames", leadNames);
			parameterMap.put("adugain", adugain);
			
			parameterMap.put("offsetMilliSeconds", String.valueOf(offsetMilliSeconds));
			parameterMap.put("durationMilliSeconds", String.valueOf(durationMilliSeconds));
			parameterMap.put("graphWidthPixels", String.valueOf(graphWidthPixels));
			
			parameterMap.put("sampleFrequency", String.valueOf(samplingRate));
			parameterMap.put("signalCount", String.valueOf(leadCount));
			parameterMap.put("samplesPerSignal", String.valueOf(samplesPerChannel));
			
			String serviceURL = ResourceUtility.getAnalysisServiceURL();
			
			OMElement omeWSReturn = WebServiceUtility.callWebServiceComplexParam(parameterMap, 
															serviceMethod, // Method of the service which implements the copy. e.g. "copyDataFilesToAnalysis"
															serviceName, // Name of the web service. e.g. "dataTransferService"
															serviceURL, // URL of the Analysis Web Service to send data files to. e.g. "http://icmv058.icm.jhu.edu:8080/axis2/services/";
															null);
			
			long webServiceTime = System.currentTimeMillis();

			//***************************************************
			try{
				if(omeWSReturn != null){
					Map<String, Object> paramMap = WebServiceUtility.buildParamMap(omeWSReturn);
					boolean isGoodData = ((String) paramMap.get("Status")).equals("success");
					
					short siLeadCount=0;
					String[] saChannelName;
					if(isGoodData){
						int iSampleCount = Integer.parseInt((String) paramMap.get("SampleCount"));
						siLeadCount = Short.parseShort((String)paramMap.get("LeadCount"));
						
						int iSegmentOffset = new Integer( (String)paramMap.get("Offset") );
						int iSkippedSamples = new Integer( (String)paramMap.get("SkippedSamples") );
						int iSegmentDuration = new Integer( (String)paramMap.get("SegmentDuration") );
						String[] saTempDataIn = new String[siLeadCount+1]; //initialize the string array which will receive the CSV data for each channel
						saChannelName = new String[siLeadCount+1]; // array of names of each channel(lead) e.g. I, II, III, V1, V2...
						
						
						String[] lNames = null;
						if(leadNames != null){
							lNames = leadNames.split(",");
						}
						
						for(int leadNum=0;leadNum < siLeadCount+1;leadNum++){
							String key = "lead_"+leadNum;
							saTempDataIn[leadNum] = (String)paramMap.get(key); 
							if(leadNum==0){
								saChannelName[0]="millisecond";
							}else{
								if(lNames != null){
									saChannelName[leadNum] = lNames[leadNum-1];
								}else{
									saChannelName[leadNum] = ServerUtility.guessLeadName(leadNum-1, siLeadCount);	
								}
								
							}
						}

						long parseMetaTime = System.currentTimeMillis();

						// Parse the data from the CSV strings, rotating the array in the process.
						int channelCount;
						double[][] tempData = new double[iSampleCount][siLeadCount+1];
						channelCount = siLeadCount;
						
						for(int ch = 0; ch < (channelCount+1); ch++) {
							if(saTempDataIn[ch] != null){
								String[] leadSamples = saTempDataIn[ch].split(",");
								for(int point=0;point<leadSamples.length;point++){
									tempData[point][ch] = Double.parseDouble(leadSamples[point]);
								}
							}else{
								log.error("ERROR VisualizationData.fetchSubjectVisualizationData() missing data for lead " + ch + " of " + siLeadCount);
							}
						}
						long parsePrimaryDataTime = System.currentTimeMillis();

						// populate the result object to be returned.   
						visualizationData = new VisualizationData();
						visualizationData.setECGDataLength(iSampleCount);
						visualizationData.setECGDataLeads(siLeadCount);
						visualizationData.setOffset(iSegmentOffset);
						visualizationData.setSkippedSamples(iSkippedSamples);
						visualizationData.setMsDuration(durationMilliSeconds); // msDuration);
						visualizationData.setSaLeadName(saChannelName);
						visualizationData.setECGData(tempData);
						visualizationData.setSubjectID(subjectID);
						visualizationData.setMsDuration(iSegmentDuration);
						
						long createResultObjectTime = System.currentTimeMillis();
						log.info("--- -- web service waveformDataService.fetchWFDBdataSegmentType2() took " + (webServiceTime - startTimeFetch) +  " milliSeconds.");
						log.info("--- -- parsing meta-data returned by web service took " + (parseMetaTime - webServiceTime) +  " milliSeconds.");
						log.info("--- -- parsing primary ECG data returned by web service took " + (parsePrimaryDataTime - parseMetaTime) +  " milliSeconds.");
						log.info("--- -- creating/populating result object took " + (createResultObjectTime - parsePrimaryDataTime) +  " milliSeconds.");
					}
				}
			} catch(Exception ex) {
				ex.printStackTrace();
			}
		}else{
			
			String[] leadNamesArray = leadNames.split(",");
			
			visualizationData = ECGVisualizeProcessor.fetchDataSegment(timeseriesId, leadNamesArray, offsetMilliSeconds, durationMilliSeconds, graphWidthPixels, false, samplesPerChannel, (int) samplingRate, adugain);
			
			String[] saLeadNames = new String[leadNamesArray.length+1];
			saLeadNames[0] = "millisecond";
			for (int i = 0; i < leadNamesArray.length; i++) {
				saLeadNames[i+1] = leadNamesArray[i];
			}
			
			visualizationData.setSaLeadName(saLeadNames);
			visualizationData.setSubjectID(subjectID);
			
		}

		return visualizationData;	
	}
}
