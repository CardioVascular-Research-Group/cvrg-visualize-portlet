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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;
import javax.faces.application.FacesMessage;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.ManagedProperty;
import javax.faces.bean.ViewScoped;
import javax.faces.context.FacesContext;

import org.primefaces.event.NodeSelectEvent;
import org.primefaces.event.NodeUnselectEvent;
import org.primefaces.event.SelectEvent;
import org.primefaces.event.UnselectEvent;
import org.primefaces.model.TreeNode;

import com.liferay.portal.model.User;

import edu.jhu.cvrg.data.factory.Connection;
import edu.jhu.cvrg.data.factory.ConnectionFactory;
import edu.jhu.cvrg.data.util.DataStorageException;
import edu.jhu.cvrg.waveform.model.DocumentDragVO;
import edu.jhu.cvrg.waveform.model.FileTreeNode;
import edu.jhu.cvrg.waveform.model.LocalFileTree;
import edu.jhu.cvrg.waveform.utility.ResourceUtility;

@ViewScoped
@ManagedBean(name = "visualizeBacking")
public class VisualizeBacking extends BackingBean implements Serializable {

	@ManagedProperty("#{visualizeSharedBacking}")
	private VisualizeSharedBacking visualizeSharedBacking;  
	
	private static final long serialVersionUID = -4006126553152259063L;

	private DocumentDragVO selectedStudyObject;  
	
	private ArrayList<DocumentDragVO> tableList;
	private LocalFileTree fileTree;
	
	private User userModel;
	
	@PostConstruct
	public void init() { 
		this.getLog().info("*************** VisualizeBacking.java, init() copied from analyze to replace initialize() **********************");
		userModel = ResourceUtility.getCurrentUser();
		if(userModel != null){
			visualizeSharedBacking.reset();
			if(fileTree == null){
				this.getLog().info("*** creating new FileTree for user:" + userModel.getScreenName());
				fileTree = new LocalFileTree(userModel.getUserId());
				this.getLog().info("*** fileTree == null :" + (fileTree == null));
			}else{
				this.getLog().info("*** fileTree already exists *** ");
			}
		}
		
		if(visualizeSharedBacking.getErrorMessages() != null && !visualizeSharedBacking.getErrorMessages().isEmpty()){
			for (String message : visualizeSharedBacking.getErrorMessages()) {
				FacesContext.getCurrentInstance().addMessage(null, new FacesMessage(FacesMessage.SEVERITY_FATAL, "Error" , "<br />"+message));	
			}
			if(tableList != null){
				tableList.clear();
			}
			visualizeSharedBacking.setErrorMessages(null);
		}
			
		this.getLog().info("*************** VisualizeBacking.java, init() finished **********************");
	}
    
   /** Loads the data for the selected ecg file and switches to the 12 lead graph panel.
     * Handles onclick event for the button "btnView12LeadECG" in the viewA_SelectionTree.xhtml view.
     * 
     */
    public String graphSelectedECG(){
    	String nextView= null;
    	visualizeSharedBacking.setErrorMessages(null);
    	this.getLog().info("+++ VisualizeBacking.java, graphSelectedECG() +++ ");
    	
    	if(tableList != null && tableList.size() == 1){
    		this.setSelectedStudyObject(tableList.get(0));
		}
    	
    	if(selectedStudyObject != null){
    		this.getLog().info("+ selected record:" + selectedStudyObject.getDocumentRecord().getRecordName() + " lead count:" + selectedStudyObject.getDocumentRecord().getLeadCount());
	   		nextView = "viewB_DisplayMultiLeads";
    	}else{
    		FacesContext.getCurrentInstance().addMessage(null, new FacesMessage(FacesMessage.SEVERITY_WARN, "Validation Error" , "<br />Please select a file."));	
    	}
    	
    	this.getLog().info("+ nextView:" + nextView); 
		return nextView;
    }

    public void folderSelect(NodeSelectEvent event){
		TreeNode node = event.getTreeNode();
		if(!node.getType().equals(FileTreeNode.FOLDER_TYPE)){
			fileTree.selectAllChildNodes(node);
		}
	}
	
	public void folderUnSelect(NodeUnselectEvent event){
		TreeNode node = event.getTreeNode();
		node.setSelected(false);
		if(!node.getType().equals(FileTreeNode.FOLDER_TYPE)){
			fileTree.unSelectAllChildNodes(node);
		}
	}

	public void treeToTable() {
        Map<String,String> params = FacesContext.getCurrentInstance().getExternalContext().getRequestParameterMap();
        String property = params.get("property");
        String type = params.get("type");
        
        if(property!=null && !property.isEmpty()){
        	try {
				Connection con = ConnectionFactory.createConnection();
				
				if(tableList == null){
					tableList = new ArrayList<DocumentDragVO>();
				}
				
				DocumentDragVO vo = null;
				
				if("leaf".equals(type) || FileTreeNode.FILE_TYPE.equals(type) || FileTreeNode.FILE_ANALYSIS_TYPE.equals(type)){
					FileTreeNode node = fileTree.getNodeByReference(property);
					if(node != null){
						vo = new DocumentDragVO(node, con.getDocumentRecordById(node.getDocumentRecordId()));
						if(!tableList.contains(vo)){
							tableList.add(vo);	
						}
					}	
				}else if("parent".equals(type) || FileTreeNode.FOLDER_TYPE.equals(type)){
					List<FileTreeNode> nodes = fileTree.getNodesByReference(property);
					if(nodes!=null){
						for (FileTreeNode node : nodes) {
							
							vo = new DocumentDragVO(node, con.getDocumentRecordById(node.getDocumentRecordId()));
							if(!tableList.contains(vo)){
				        		tableList.add(vo);	
				        	}			
						}
					}
				}
			} catch (DataStorageException e) {
				this.getLog().error("Error on node2dto conversion. " + e.getMessage());
			}
        }else{
        	System.err.println("DRAGDROP = ERROR");
        }
    }
    
    public void removeTableItem(){
    	Map<String,String> params = FacesContext.getCurrentInstance().getExternalContext().getRequestParameterMap();
        String index = params.get("index");
        
    	if(index != null ){
    		int indexTableToRemove = Integer.parseInt(index);
    		
    		if(indexTableToRemove >= 0 && (tableList != null && tableList.size() > indexTableToRemove)){
    			tableList.remove(indexTableToRemove);
    		}
    	}
    }
	
	
	public void onRowSelect(SelectEvent event) {
		setSelectedStudyObject((DocumentDragVO) event.getObject());
	}

	public void onRowUnselect(UnselectEvent event) {
		setSelectedStudyObject(null);
	}
	
	public void setSelectedStudyObject(DocumentDragVO selectedStudyObject) {
		this.selectedStudyObject = selectedStudyObject;
		if(selectedStudyObject != null){
			visualizeSharedBacking.setSharedStudyEntry(selectedStudyObject.getDocumentRecord());
		}else{
			visualizeSharedBacking.setSharedStudyEntry(null);
		}
		this.getLog().info("Graphed Study Object Set");
	}

	public DocumentDragVO getSelectedStudyObject() {
		return selectedStudyObject;
	}

	public LocalFileTree getFileTree() {
		return fileTree;
	}

	public void setFileTree(LocalFileTree fileTree) {
		this.fileTree = fileTree;
	}

	public VisualizeSharedBacking getVisualizeSharedBacking() {
		return visualizeSharedBacking;
	}

	public void setVisualizeSharedBacking(VisualizeSharedBacking visualizeSharedBacking) {
		this.visualizeSharedBacking = visualizeSharedBacking;
	}

	public User getUser(){
		return userModel;
	}

	public ArrayList<DocumentDragVO> getTableList() {
		return tableList;
	}

	public void setTableList(ArrayList<DocumentDragVO> tableList) {
		this.tableList = tableList;
	}
}
