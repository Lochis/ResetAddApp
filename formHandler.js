function pushAppObject(formData){
	console.log(formData);
	let appName = "";
	let VASPReport = "";

	//if not empty, put appName together with link
	if (formData.appLink != ""){
		appName = `<a target="_blank" href='${formData.appLink}'>${formData.appName}</a>`;
	} else {
		appName = formData.appName;
	}

	if(formData.status == "Red"){
		VASPReport = "Very High Risk ";
	}
    
    if(formData.VASPLink != ""){
        if (formData.VASPReport === 'Report'){
            VASPReport += `<a target="_blank" href='${formData.VASPLink}'>Report</a>`;
        } else if (formData.VASPReport === 'NOSPIC') {
            VASPReport += `<a target="_blank" href='${formData.VASPLink}'>Report</a> No Student Information Collected`;
        } else if (formData.VASPReport === 'Default') {
            VASPReport = formData.VASPReport;                   // going to error out/ not pass through anyways, so redefined
        }
    }

	let fullJson = {
        "Application" : appName, 
        "Status" : formData.status, 
        "Description and Cost" : formData.desc,
        "VASP Educator Report" : VASPReport,
    };

    return fullJson;
}

module.exports ={
    pushAppObject: pushAppObject
}