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

    var sublist = form.addSublist({
      id: "custpage_lotnum_list",
      label: "LotNumbered Item Results",
      type: ui.SublistType.INLINEEDITOR,
    });

    // Fields (same as your current)
    sublist.addField({
      id: "custpage_item_checked",
      type: ui.FieldType.CHECKBOX,
      label: "select",
    });
    sublist
      .addField({
        id: "custpage_item_id",
        type: ui.FieldType.TEXT,
        label: "ItemName",
      })
      .updateDisplayType({
        displayType: ui.FieldDisplayType.DISABLED,
      });
    sublist
      .addField({
        id: "custpage_item_id_value",
        type: ui.FieldType.TEXT,
        label: "ItemName",
      })
      .updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
    sublist
      .addField({
        id: "custpage_lot_num",
        type: ui.FieldType.TEXT,
        label: "Lot Number",
      })
      .updateDisplayType({
        displayType: ui.FieldDisplayType.DISABLED,
      });
    sublist
      .addField({
        id: "custpage_lot_num_value",
        type: ui.FieldType.TEXT,
        label: "Lot Number",
      })
      .updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
    sublist
      .addField({
        id: "custpage_binnum",
        type: ui.FieldType.TEXT,
        label: "BinNumber",
      })
      .updateDisplayType({
        displayType: ui.FieldDisplayType.DISABLED,
      });
    sublist
      .addField({
        id: "custpage_binnum_value",
        type: ui.FieldType.TEXT,
        label: "BinNumber",
      })
      .updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
    sublist
      .addField({
        id: "custpage_location",
        type: ui.FieldType.TEXT,
        label: "Location",
      })
      .updateDisplayType({
        displayType: ui.FieldDisplayType.DISABLED,
      });
    sublist
      .addField({
        id: "custpage_location_value",
        type: ui.FieldType.TEXT,
        label: "Location",
      })
      .updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
    sublist
      .addField({
        id: "custpage_onhand",
        type: ui.FieldType.TEXT,
        label: "onhand",
      })
      .updateDisplayType({
        displayType: ui.FieldDisplayType.DISABLED,
      });
    sublist
      .addField({
        id: "custpage_available",
        type: ui.FieldType.TEXT,
        label: "onavailable",
      })
      .updateDisplayType({
        displayType: ui.FieldDisplayType.DISABLED,
      });
    sublist
      .addField({
        id: "custpage_status",
        type: ui.FieldType.TEXT,
        label: "Status",
      })
      .updateDisplayType({
        displayType: ui.FieldDisplayType.DISABLED,
      });
    sublist
      .addField({
        id: "custpage_orig_status",
        type: ui.FieldType.SELECT,
        label: "Orig_Status",
      })
      .updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
    sublist
      .addField({
        id: "custpage_update_quantity",
        type: ui.FieldType.TEXT,
        label: "ChangableQuantity",
      })
      .updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL });

    var statusField = sublist.addField({
      id: "custpage_update_status",
      type: ui.FieldType.SELECT,
      label: "ChangableStatus",
    });
    // populate inventorystatus options
    try {
      search
        .create({ type: "inventorystatus", columns: ["name"] })
        .run()
        .each(function (r) {
          statusField.addSelectOption({
            value: r.id,
            text: r.getValue("name"),
          });
          return true;
        });
    } catch (e) {
      log.debug("Could not load inventorystatus options", e);
    }

    // Search inventorybalance (same as you had)
    var inventorydetailSearchObj = search.create({
      type: "inventorybalance",
      filters: [["item.islotitem", "is", "T"]],
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
    var paged = inventorydetailSearchObj.runPaged({ pageSize: 5000 });
    var idx = 0;
    paged.pageRanges.forEach(function (pr) {
      var page = paged.fetch({ index: pr.index });
      page.data.forEach(function (result) {
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

    var rows = Object.keys(grouped).map(function (k) {
      return grouped[k];
    });
    rows.sort(function (a, b) {
      return String(a.lotNumText).localeCompare(String(b.lotNumText));
    });

    var pageIndex = parseInt(context.request.parameters.page) || 0;
    var pageSize = 25;
    var start = pageIndex * pageSize;
    var pageRows = rows.slice(start, start + pageSize);

    var line = 0;
    pageRows.forEach(function (row) {
      sublist.setSublistValue({
        id: "custpage_lot_num",
        line: line,
        value: safe(row.lotNumText) || "",
      });
      sublist.setSublistValue({
        id: "custpage_lot_num_value",
        line: line,
        value: safeInt(row.lotNum) || "",
      });
      sublist.setSublistValue({
        id: "custpage_binnum",
        line: line,
        value: safe(row.binNumText) || "",
      });
      sublist.setSublistValue({
        id: "custpage_binnum_value",
        line: line,
        value: safeInt(row.binNum) || "",
      });
      sublist.setSublistValue({
        id: "custpage_onhand",
        line: line,
        value: safe(row.onhand) || "",
      });
      sublist.setSublistValue({
        id: "custpage_available",
        line: line,
        value: safe(row.available) || "",
      });
      sublist.setSublistValue({
        id: "custpage_status",
        line: line,
        value: row.statusText || "",
      });
      sublist.setSublistValue({
        id: "custpage_orig_status",
        line: line,
        value: row.status || "",
      });
      sublist.setSublistValue({
        id: "custpage_item_id",
        line: line,
        value: safe(row.itemIdText) || "",
      });
      sublist.setSublistValue({
        id: "custpage_item_id_value",
        line: line,
        value: safeInt(row.itemId) || "",
      });
      sublist.setSublistValue({
        id: "custpage_location",
        line: line,
        value: safe(row.locationText) || "",
      });
      sublist.setSublistValue({
        id: "custpage_location_value",
        line: line,
        value: safeInt(row.location) || "",
      });
      line++;
    });

    form.addButton({
      id: "custpage_reload",
      label: "Update Status",
      functionName: "performUpdateStatus",
    });

    // Input field for page number
    var gotoPageField = form.addField({
      id: "custpage_goto_page",
      type: ui.FieldType.INTEGER,
      label: "Go To Page",
    });
    gotoPageField.defaultValue = (pageIndex + 1).toString(); // show current page

    if (pageIndex > 0)
      form.addButton({
        id: "custpage_prev",
        label: "Previous Page",
        functionName: "goPrev",
      });

    var totalPages = Math.ceil(rows.length / pageSize);

    var pageInfo = form.addField({
      id: "custpage_page_info",
      type: ui.FieldType.INLINEHTML,
      label: "Page Info",
    });

    pageInfo.defaultValue =
      "<b>Page " + (pageIndex + 1) + " of " + totalPages + "</b>";

    if (pageIndex < totalPages - 1)
      form.addButton({
        id: "custpage_next",
        label: "Next Page",
        functionName: "goNext",
      });

    form.addButton({
      id: "custpage_goto_button",
      label: "Go To Page",
      functionName: "gotoPage",
    });

    form.clientScriptModulePath = "./CS_LotNumberStatus.js";
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
      var binNum = r.binNum ? parseInt(r.binNum) : null;
      var quantity = parseFloat(r.updatequantity || r.onhand || 0);

      // todo: update this
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

  return { onRequest: onRequest };
});
