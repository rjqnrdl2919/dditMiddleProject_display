package kr.or.ddit.cpmn.graph.vo;

import java.sql.Timestamp;

public class GraphVO {
	
	private String categoryId;		// 카테고리 코드
	private String addressCode;		// 행정동 코드
	private Timestamp savedAt;		// 저장 일시
	private String category1ST;		// 1차 유형 코드
	private String category2ND;		// 2차 유형 코드
	private int isHarmful;			// 악성 여부
	private int isSpam;				// 스팸 여부
	private int isUrgent;			// 긴급 여부
	private String status;			// 민원 상태
	private int complaintCount;		// 민원 갯수
	private String timeSlot;		// 선택한 시간 범위
	
	// 주소 정보 조인
	private String sidoName;
	private String sigunguName;
	private String emdName;
	
	// 카테고리 정보 조인
	private String categoryName;	// 카테고리 한글 이름
	private String categoryCode;	// 카테고리 영문 이름
	private String parentId;		// 부모 유형 코드
	
	public String getCategoryId() {
		return categoryId;
	}
	public void setCategoryId(String categoryId) {
		this.categoryId = categoryId;
	}
	public String getAddressCode() {
		return addressCode;
	}
	public void setAddressCode(String addressCode) {
		this.addressCode = addressCode;
	}
	public Timestamp getSavedAt() {
		return savedAt;
	}
	public void setSavedAt(Timestamp savedAt) {
		this.savedAt = savedAt;
	}
	public String getCategory1ST() {
		return category1ST;
	}
	public void setCategory1ST(String category1st) {
		category1ST = category1st;
	}
	public String getCategory2ND() {
		return category2ND;
	}
	public void setCategory2ND(String category2nd) {
		category2ND = category2nd;
	}
	public int getIsHarmful() {
		return isHarmful;
	}
	public void setIsHarmful(int isHarmful) {
		this.isHarmful = isHarmful;
	}
	public int getIsSpam() {
		return isSpam;
	}
	public void setIsSpam(int isSpam) {
		this.isSpam = isSpam;
	}
	public int getIsUrgent() {
		return isUrgent;
	}
	public void setIsUrgent(int isUrgent) {
		this.isUrgent = isUrgent;
	}
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
	}
	public int getComplaintCount() {
		return complaintCount;
	}
	public void setComplaintCount(int complaintCount) {
		this.complaintCount = complaintCount;
	}
	public String getSidoName() {
		return sidoName;
	}
	public void setSidoName(String sidoName) {
		this.sidoName = sidoName;
	}
	public String getSigunguName() {
		return sigunguName;
	}
	public void setSigunguName(String sigunguName) {
		this.sigunguName = sigunguName;
	}
	public String getEmdName() {
		return emdName;
	}
	public void setEmdName(String emdName) {
		this.emdName = emdName;
	}
	public String getCategoryName() {
		return categoryName;
	}
	public void setCategoryName(String categoryName) {
		this.categoryName = categoryName;
	}
	public String getCategoryCode() {
		return categoryCode;
	}
	public void setCategoryCode(String categoryCode) {
		this.categoryCode = categoryCode;
	}
	public String getTimeSlot() {
		return timeSlot;
	}
	public void setTimeSlot(String timeSlot) {
		this.timeSlot = timeSlot;
	}
	public String getParentId() {
		return parentId;
	}
	public void setParentId(String parentId) {
		this.parentId = parentId;
	}
}
