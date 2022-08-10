import { useEffect } from "react";
import records from "../../pages/api/couchdb/records/[email]";


//Component for rendering records in manage record page
export default function Record(props:any) {
  const { data, action } = props;
  if (data.scope) {
    return (
      <div className="record-row">
        <p style={{width: "20px", margin: "5px", fontWeight: "600"}}>{data.id}</p>
        <div style={{width: "100%", maxWidth:"600px"}}>
          <div className="record-row">
            <p className="record-text">
              {data.name} - {data.date}
            </p>
            <button className="btn btn-small" onClick={() => action("editRecord", data)}>Edit</button>
          </div>
          <div className="record-row">
            <p className="record-text">{data.url}</p>
            <p style={{ fontSize: "12px", fontWeight: "800", width: "50px"}}>
              {data.scope.join(", ")}
            </p>
          </div>
        </div>
      </div>
    );
  } else {
    return <div></div>
  }
  
}
