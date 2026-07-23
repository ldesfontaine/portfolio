type TableColumn = {
  label: string;
  align: "left" | "center" | "right";
};

type TableCell = {
  value: string;
  tone: "default" | "positive" | "warning";
};

export default function EditorialTable({
  caption,
  columns,
  rows,
}: {
  caption?: string | null;
  columns: TableColumn[];
  rows: { cells: TableCell[] }[];
}) {
  return (
    <figure className="editorial-table-wrap">
      <div className="editorial-table-scroll">
        <table className="editorial-table">
          {caption ? <caption>{caption}</caption> : null}
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={`${column.label}-${index}`} style={{ textAlign: column.align }}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.cells.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    data-tone={cell.tone}
                    style={{ textAlign: columns[cellIndex]?.align ?? "left" }}
                  >
                    {cell.value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
