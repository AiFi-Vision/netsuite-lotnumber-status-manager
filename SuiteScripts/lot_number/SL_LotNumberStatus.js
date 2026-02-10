/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 *
 */

define(["N/record", "N/search", "N/log", "N/ui/serverWidget"], function (
  record,
  search,
  log,
  ui
) {
  function safeInt(v) {
    var n = parseInt(v);
    return isNaN(n) ? "0" : n;
  }

  function safe(v) {
    return v === null || v === undefined || v === "" ? " " : String(v);
  }

  function onRequest(context) {
    if (context.request.method === "GET") {
      renderPage(context);
    } else {
      handlePost(context);
    }
  }

  function renderPage(context) {
    var form = ui.createForm({ title: "Lot Numbered Items Status Manager" });

    var params = context.request.parameters;

    var filterItem     = params.item || null;
    var filterLot      = params.lot || null;
    var filterBin      = params.bin || null;
    var filterLocation = params.location || null;


    // --- SUBLIST ---
    var sublist = form.addSublist({
      id: "custpage_lotnum_list",
      label: "LotNumbered Item Results",
      type: ui.SublistType.INLINEEDITOR,
    });

    // --- FIELDS ---
    sublist.addField({
      id: "custpage_item_checked",
      type: ui.FieldType.CHECKBOX,
      label: "Select",
    });
    sublist
      .addField({
        id: "custpage_item_id",
        type: ui.FieldType.TEXT,
        label: "Item Name",
      })
      .updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
    sublist
      .addField({
        id: "custpage_item_id_value",
        type: ui.FieldType.TEXT,
        label: "Item Internal ID",
      })
      .updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
    sublist
      .addField({
        id: "custpage_lot_num",
        type: ui.FieldType.TEXT,
        label: "Lot Number",
      })
      .updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
    sublist
      .addField({
        id: "custpage_lot_num_value",
        type: ui.FieldType.TEXT,
        label: "Lot Internal ID",
      })
      .updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
    sublist
      .addField({
        id: "custpage_binnum",
        type: ui.FieldType.TEXT,
        label: "Bin Number",
      })
      .updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
    sublist
      .addField({
        id: "custpage_binnum_value",
        type: ui.FieldType.TEXT,
        label: "Bin Internal ID",
      })
      .updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
    sublist
      .addField({
        id: "custpage_location",
        type: ui.FieldType.TEXT,
        label: "Location",
      })
      .updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
    sublist
      .addField({
        id: "custpage_location_value",
        type: ui.FieldType.TEXT,
        label: "Location Internal ID",
      })
      .updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
    sublist
      .addField({
        id: "custpage_onhand",
        type: ui.FieldType.TEXT,
        label: "On Hand",
      })
      .updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
    sublist
      .addField({
        id: "custpage_available",
        type: ui.FieldType.TEXT,
        label: "Available",
      })
      .updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
    sublist
      .addField({
        id: "custpage_status",
        type: ui.FieldType.TEXT,
        label: "Current Status",
      })
      .updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
    sublist
      .addField({
        id: "custpage_orig_status",
        type: ui.FieldType.SELECT,
        label: "Original Status",
      })
      .updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
    sublist.addField({
      id: "custpage_update_quantity",
      type: ui.FieldType.TEXT,
      label: "Changeable Quantity",
    });

    var statusField = sublist.addField({
      id: "custpage_update_status",
      type: ui.FieldType.SELECT,
      label: "Changeable Status",
    });

    // Populate inventory status options
    try {
      search
        .create({ type: "inventorystatus", columns: ["name"] })
        .run()
        .each((r) => {
          statusField.addSelectOption({
            value: r.id,
            text: r.getValue("name"),
          });
          return true;
        });
    } catch (e) {
      log.debug("Could not load inventorystatus options", e);
    }

    var filters = [
      ["item.islotitem", "is", "T"],
      "AND",
      ["status", "noneof", "3"]
    ];

    if (filterItem) {
      filters.push("AND", ["item", "anyof", filterItem]);
    }

    if (filterLot) {
      filters.push("AND", ["inventorynumber", "anyof", filterLot]);
    }

    if (filterBin) {
      filters.push("AND", ["binnumber", "anyof", filterBin]);
    }

    if (filterLocation) {
      filters.push("AND", ["location", "anyof", filterLocation]);
    }

    // --- SEARCH INVENTORY BALANCE ---
    var inventorySearch = search.create({
      type: "inventorybalance",
      filters: filters,
      columns: [
        search.createColumn({ name: "item" }),
        search.createColumn({ name: "binnumber" }),
        search.createColumn({ name: "location" }),
        search.createColumn({ name: "inventorynumber" }),
        search.createColumn({ name: "status" }),
        search.createColumn({ name: "onhand" }),
        search.createColumn({ name: "available" }),
      ],
    });

    var grouped = {};
    var paged = inventorySearch.runPaged({ pageSize: 5000 });
    var idx = 0;
    paged.pageRanges.forEach((pr) => {
      var page = paged.fetch({ index: pr.index });
      page.data.forEach((result) => {
        grouped[idx] = {
          lotNum: result.getValue({ name: "inventorynumber" }),
          lotNumText: result.getText({ name: "inventorynumber" }),
          binNum: result.getValue({ name: "binnumber" }),
          binNumText: result.getText({ name: "binnumber" }),
          status: result.getValue({ name: "status" }),
          statusText: result.getText({ name: "status" }),
          itemId: result.getValue({ name: "item" }),
          itemIdText: result.getText({ name: "item" }),
          location: result.getValue({ name: "location" }),
          locationText: result.getText({ name: "location" }),
          onhand: result.getValue({ name: "onhand" }),
          available: result.getValue({ name: "available" }),
        };
        idx++;
      });
    });

    var rows = Object.values(grouped);
    rows.sort((a, b) =>
      String(a.lotNumText).localeCompare(String(b.lotNumText))
    );

    // --- PAGINATION ---
    var pageIndex = parseInt(context.request.parameters.page) || 0;
    var pageSize = 20;
    var totalPages = Math.ceil(rows.length / pageSize);
    var start = pageIndex * pageSize;
    var pageRows = rows.slice(start, start + pageSize);

    // --- POPULATE SUBLIST ---
    pageRows.forEach(function (row, line) {
      sublist.setSublistValue({
        id: "custpage_item_id",
        line,
        value: safe(row.itemIdText),
      });
      sublist.setSublistValue({
        id: "custpage_item_id_value",
        line,
        value: safe(row.itemId),
      });
      sublist.setSublistValue({
        id: "custpage_lot_num",
        line,
        value: safe(row.lotNumText),
      });
      sublist.setSublistValue({
        id: "custpage_lot_num_value",
        line,
        value: safe(row.lotNum),
      });
      sublist.setSublistValue({
        id: "custpage_binnum",
        line,
        value: safe(row.binNumText),
      });
      sublist.setSublistValue({
        id: "custpage_binnum_value",
        line,
        value: safe(row.binNum),
      });
      sublist.setSublistValue({
        id: "custpage_location",
        line,
        value: safe(row.locationText),
      });
      sublist.setSublistValue({
        id: "custpage_location_value",
        line,
        value: safe(row.location),
      });
      sublist.setSublistValue({
        id: "custpage_onhand",
        line,
        value: safe(row.onhand),
      });
      sublist.setSublistValue({
        id: "custpage_available",
        line,
        value: safe(row.available),
      });
      sublist.setSublistValue({
        id: "custpage_status",
        line,
        value: safe(row.statusText),
      });
      sublist.setSublistValue({
        id: "custpage_orig_status",
        line,
        value: safe(row.status),
      });
    });

    form.clientScriptModulePath = "./CS_LotNumberStatus.js";

    // Item name list
    var itemOptions = [];

    var itemSearch = search.create({
      type: search.Type.ITEM,
      columns: ["itemid"],
    });

    var pagedData = itemSearch.runPaged({ pageSize: 1000 }); // Safe paging

    pagedData.pageRanges.forEach(function(pageRange) {
      var page = pagedData.fetch({ index: pageRange.index });
      page.data.forEach(function(result) {
        itemOptions.push({
          value: result.id,
          text: result.getValue("itemid"),
        });
      });
    });


    // Lot number list
    var lotOptions = [];

    var lotSearch = search.create({
      type: "inventorynumber", // Use string instead of search.Type.INVENTORYNUMBER
      columns: ["inventorynumber"],
    });

    var pagedData = lotSearch.runPaged({ pageSize: 1000 });

    pagedData.pageRanges.forEach(function (pageRange) {
      var page = pagedData.fetch({ index: pageRange.index });
      page.data.forEach(function (result) {
        lotOptions.push({
          value: result.id,
          text: result.getValue("inventorynumber"),
        });
      });
    });

    // --- Bin Number list ---
    var binOptions = [];
    try {
      var binSearch = search.create({
        type: "bin", // only works if Bin Management feature is enabled
        columns: ["binnumber"],
      });

      var binPaged = binSearch.runPaged({ pageSize: 1000 });
      binPaged.pageRanges.forEach(function (pageRange) {
        var page = binPaged.fetch({ index: pageRange.index });
        page.data.forEach(function (result) {
          binOptions.push({
            value: result.id,
            text: result.getValue("binnumber"),
          });
        });
      });
    } catch (e) {
      log.debug("Bin Management feature disabled, skipping bin options", e);
      binOptions = []; // empty array if feature not available
    }

    // --- Location list ---
    var locationOptions = [];
    var locationSearch = search.create({
      type: search.Type.LOCATION,
      columns: ["name"],
    });

    var locationPaged = locationSearch.runPaged({ pageSize: 1000 });
    locationPaged.pageRanges.forEach(function (pageRange) {
      var page = locationPaged.fetch({ index: pageRange.index });
      page.data.forEach(function (result) {
        locationOptions.push({
          value: result.id,
          text: result.getValue("name"),
        });
      });
    });

    // --- GO TO PAGE INPUT ---
    var buttonsRowHtml = `
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
        <button type="button" id="custpage_update_status_btn">Update Status</button>
        <button type="button" id="custpage_prev_btn" ${pageIndex === 0 ? "disabled" : ""}>Previous</button>
        <label for="custpage_goto_page_input"> Page:</label>
        <input type="number" id="custpage_goto_page_input" min="1" max="${totalPages}" value="${pageIndex + 1}" style="width:60px;"><label> / ${totalPages}</label>
        <button type="button" id="custpage_next_btn" ${pageIndex + 1 >= totalPages ? "disabled" : ""}>Next</button>

        ${buildSelect("custpage_filter_item", "Item", itemOptions, filterItem)}
        ${buildSelect("custpage_filter_lot", "Lot", lotOptions, filterLot)}
        ${buildSelect("custpage_filter_bin", "Bin", binOptions, filterBin)}
        ${buildSelect("custpage_filter_location", "Location", locationOptions, filterLocation)}
      </div>
      <script>
          // expose server value to client
          var TOTAL_PAGES = ${totalPages};
      </script>
      `;

    var buttonsField = form.addField({
      id: "custpage_buttons_row",
      type: ui.FieldType.INLINEHTML,
      label: "Buttons Row",
    });

    buttonsField.defaultValue = buttonsRowHtml;

    // Hidden page index
    var pageField = form.addField({
      id: "custpage_page",
      label: "Page",
      type: ui.FieldType.INTEGER,
    });
    pageField.defaultValue = pageIndex.toString();
    pageField.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });

    context.response.writePage(form);
  }

  function handlePost(context) {
    var body;
    try {
      body = JSON.parse(context.request.body);
    } catch (e) {
      log.error("Invalid JSON", e);
      context.response.write("Invalid JSON");
      return;
    }

    body.forEach(function (r) {
      var lotNumId = parseInt(r.lotnum); // convert to integer
      var lotNumText = r.lotnum_text; // Lot number
      var itemId = parseInt(r.itemid); // convert to integer
      var locationId = parseInt(r.location); // convert to integer
      var binNum = r.binnum ? parseInt(r.binnum) : null;
      var quantity = parseFloat(r.updatequantity || r.onhand || 0);

      var prevStatus = r.prevStatus || r.updatestatus;
      var newStatus = parseInt(r.updatestatus || r.newStatus);

      if (!lotNumId || !lotNumText || !itemId || !locationId || !newStatus) {
        log.debug("Skipping line, missing required fields", r);
        return;
      }

      try {
        createInventoryStatusChange(
          locationId,
          prevStatus,
          itemId,
          lotNumId,
          binNum,
          quantity,
          newStatus
        );
      } catch (e) {
        log.error(
          "Error creating Inventory Status Change for lot " + lotNumId,
          e
        );
      }
    });

    context.response.write("Success");
  }

  function createInventoryStatusChange(
    locationId,
    prevStatusId,
    itemId,
    lotNumId,
    binNumId,
    quantity,
    newStatusId
  ) {
    try {
      log.audit("createInventoryStatusChange: Parameters", {
        locationId,
        prevStatusId,
        itemId,
        lotNumId,
        binNumId,
        quantity,
        newStatusId,
      });

      // Validate mandatory fields
      if (!locationId || !itemId || !lotNumId || !quantity || !newStatusId) {
        throw new Error("Missing required parameter(s)");
      }

      var rec = record.create({
        type: record.Type.INVENTORY_STATUS_CHANGE,
        isDynamic: true,
      });

      rec.setValue({ fieldId: "location", value: parseInt(locationId) });
      if (prevStatusId) {
        rec.setValue({
          fieldId: "previousstatus",
          value: parseInt(prevStatusId),
        });
      }
      rec.setValue({ fieldId: "revisedstatus", value: parseInt(newStatusId) });

      // Add inventory line
      rec.selectNewLine({ sublistId: "inventory" });
      rec.setCurrentSublistValue({
        sublistId: "inventory",
        fieldId: "item",
        value: parseInt(itemId),
      });
      rec.setCurrentSublistValue({
        sublistId: "inventory",
        fieldId: "quantity",
        value: parseFloat(quantity),
      });

      // Add subrecord: inventorydetail -> inventoryassignment
      var invDetail = rec.getCurrentSublistSubrecord({
        sublistId: "inventory",
        fieldId: "inventorydetail",
      });

      invDetail.selectNewLine({ sublistId: "inventoryassignment" });

      // Set lot number (must be inventory number internal ID)
      invDetail.setCurrentSublistValue({
        sublistId: "inventoryassignment",
        fieldId: "issueinventorynumber",
        value: parseInt(lotNumId),
      });

      // Set quantity
      invDetail.setCurrentSublistValue({
        sublistId: "inventoryassignment",
        fieldId: "quantity",
        value: Math.abs(parseFloat(quantity)),
      });

      // Set bin if provided
      if (binNumId) {
        invDetail.setCurrentSublistValue({
          sublistId: "inventoryassignment",
          fieldId: "binnumber",
          value: parseInt(binNumId),
        });
      }

      invDetail.setCurrentSublistValue({
        sublistId: "inventoryassignment",
        fieldId: "inventorystatus",
        value: parseInt(newStatusId),
      });

      invDetail.commitLine({ sublistId: "inventoryassignment" });

      rec.commitLine({ sublistId: "inventory" });

      var recId = rec.save();
      log.audit("Inventory Status Change record created", { recId });

      return recId;
    } catch (e) {
      log.error({
        title: "Error in createInventoryStatusChange",
        details: {
          message: e.message,
          stack: e.stack,
          params: {
            locationId,
            prevStatusId,
            itemId,
            lotNumId,
            binNumId,
            quantity,
            newStatusId,
          },
        },
      });
      throw e; // rethrow if needed
    }
  }

  // Build option lists on the server
  function buildSelect(id, label, options, selectedValue) {
    var html = `<label style="margin-left:10px;">${label}:</label>`;
    html += `<select id="${id}" style="margin-right:10px;">`;

    // Add "All" option and mark as selected if selectedValue is empty or null
    html += `<option value="" ${!selectedValue ? "selected" : ""}>All</option>`;

    options.forEach(function(o) {
      // Check if this option should be selected
      var isSelected = selectedValue && o.value == selectedValue ? "selected" : "";
      html += `<option value="${o.value}" ${isSelected}>${o.text}</option>`;
    });

    html += `</select>`;
    return html;
  }

  return { onRequest: onRequest };
});
