import React from "react";
import { FixedSizeList as List } from "react-window";
import "./VirtualTable.css"; // optional for styling

// Example table columns
const columns = ["ID", "Name", "Email", "Age"];

// Example row renderer
const Row = ({ index, style, data }) => {
  const row = data[index];
  return (
    <div className="row" style={style}>
      <div className="cell">{row.id}</div>
      <div className="cell">{row.name}</div>
      <div className="cell">{row.email}</div>
      <div className="cell">{row.age}</div>
    </div>
  );
};

export default function VirtualTable({ data }) {
  const rowHeight = 40; // height of each row in px
  const tableHeight = 400; // height of the table container in px

  return (
    <div className="table">
      <div className="header">
        {columns.map((col) => (
          <div key={col} className="cell headerCell">{col}</div>
        ))}
      </div>

      <List
        height={tableHeight}
        itemCount={data.length}
        itemSize={rowHeight}
        width="100%"
        itemData={data}
      >
        {Row}
      </List>
    </div>
  );
}
