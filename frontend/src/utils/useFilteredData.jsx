// src/utils/useFilteredData.js
export default function useFilteredData(data = [], filters = {}) {
  const {
    search = "",
    status = "",
    orderStart = "", // Posting Date From
    orderEnd = "",   // Posting Date To
    dueStart = "",   // Due Date From
    dueEnd = "",     // Due Date To
    sortField = "date",
    sortOrder = "desc",
  } = filters;

  // ✅ Normalize search
  const query = search.toLowerCase();

  // ✅ Filter logic
  let filtered = data.filter((item) => {
    const id = item.id?.toString().toLowerCase() || "";
    const poNo = item.poNo?.toLowerCase() || "";
    const customer = item.customer?.toLowerCase() || "";

    const docDate = item.postingDate || item.date || item.docDate || "";
    const dueDate = item.dueDate || "";

    const matchesSearch =
      id.includes(query) || poNo.includes(query) || customer.includes(query);

    const matchesStatus =
      !status || status === "all" || item.status?.toLowerCase() === status.toLowerCase();

    const matchesPostingDate =
      (!orderStart || new Date(docDate) >= new Date(orderStart)) &&
      (!orderEnd || new Date(docDate) <= new Date(orderEnd));

    const matchesDueDate =
      (!dueStart || new Date(dueDate) >= new Date(dueStart)) &&
      (!dueEnd || new Date(dueDate) <= new Date(dueEnd));

    // ✅ Must match all
    return matchesSearch && matchesStatus && matchesPostingDate && matchesDueDate;
  });

  // ✅ Sorting
  filtered.sort((a, b) => {
    const fieldA = new Date(a[sortField] || a.postingDate || a.docDate || a.date);
    const fieldB = new Date(b[sortField] || b.postingDate || b.docDate || b.date);

    return sortOrder === "desc" ? fieldB - fieldA : fieldA - fieldB;
  });

  return filtered;
}
