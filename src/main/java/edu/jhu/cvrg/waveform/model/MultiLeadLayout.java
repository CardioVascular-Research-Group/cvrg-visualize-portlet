package edu.jhu.cvrg.waveform.model;

import java.io.Serializable;

public class MultiLeadLayout  implements Serializable {
	private static final long serialVersionUID = 9163581624043907810L;
	int LeadNumber=0;
	boolean isLead=true;
	
	public int getLeadNumber() {
		return LeadNumber;
	}
	public void setLeadNumber(int leadNumber) {
		LeadNumber = leadNumber;
	}
	
	public boolean getLead() {
		return isLead;
	}
	public void setLead(boolean isLead) {
		this.isLead = isLead;
	}
}
