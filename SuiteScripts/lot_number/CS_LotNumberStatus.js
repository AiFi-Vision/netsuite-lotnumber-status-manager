/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */

define(["N/https", "N/url", "N/currentRecord", "N/ui/dialog"], function (
  https,
  url,
  currentRecord,
  dialog
) {
  var SUBLIST_ID = "custpage_lotnum_list";

  function hideInlineEditor() {
    var listtextnonedit = document.querySelector("tr.listtextnonedit");
    if (listtextnonedit) listtextnonedit.style.display = "none";

    var buttonRow = document.querySelector("tr.uir-machine-button-row");
    if (buttonRow) buttonRow.style.display = "none";
  }

  function goPrev() {
    changePage(-1);
  }
  function goNext() {
    changePage(1);
  }

  function changePage(offset) {
    var rec = currentRecord.get();
    var pageField = rec.getValue({ fieldId: "custpage_page" }) || 0;
    var nextPage = parseInt(pageField) + offset;

    var url = new URL(window.location.href);
    url.searchParams.set("page", nextPage);
    window.location.href = url.toString();
  }

  /**
   * Collect selected rows, validate, confirm, then POST payload to the Suitelet via N/https.
   */
  function performUpdateStatus() {
    var rec = currentRecord.get();
    var lineCount = rec.getLineCount({ sublistId: SUBLIST_ID }) || 0;
    var data = [];

    for (var i = 0; i < lineCount; i++) {
      // Checkbox on inlineeditor can return 'T'/'F' or boolean true/false — normalize
      var checked = rec.getSublistValue({
        sublistId: SUBLIST_ID,
        fieldId: "custpage_item_checked",
        line: i,
      });
      var isChecked =
        checked === true ||
        checked === "T" ||
        checked === "t" ||
        checked === "true";

      if (!isChecked) continue;

      // Read values (may be strings) and normalize
      var onhand = rec.getSublistValue({
        sublistId: SUBLIST_ID,
        fieldId: "custpage_onhand",
        line: i,
      });
      var updatequantity = rec.getSublistValue({
        sublistId: SUBLIST_ID,
        fieldId: "custpage_update_quantity",
        line: i,
      });
      var updatestatus = rec.getSublistValue({
        sublistId: SUBLIST_ID,
        fieldId: "custpage_update_status",
        line: i,
      });
      var status = rec.getSublistValue({
        sublistId: SUBLIST_ID,
        fieldId: "custpage_orig_status",
        line: i,
      });

      var lotNumText = rec.getSublistValue({
        sublistId: SUBLIST_ID,
        fieldId: "custpage_lot_num",
        line: i,
      });

      var lotNum = rec.getSublistValue({
        sublistId: SUBLIST_ID,
        fieldId: "custpage_lot_num_value",
        line: i,
      });

      var binNum = rec.getSublistValue({
        sublistId: SUBLIST_ID,
        fieldId: "custpage_binnum_value",
        line: i,
      });
      var itemid = rec.getSublistValue({
        sublistId: SUBLIST_ID,
        fieldId: "custpage_item_id_value",
        line: i,
      });
      var location = rec.getSublistValue({
        sublistId: SUBLIST_ID,
        fieldId: "custpage_location_value",
        line: i,
      });

      // Normalize numeric values
      var onhandNum = Number(onhand);
      var updateQtyNum = Number(updatequantity);

      // Basic validations
      if (!lotNum) {
        dialog.alert({
          title: "Validation error",
          message: "Missing lot number on line " + (i + 1),
        });
        return;
      }
      if (!itemid) {
        dialog.alert({
          title: "Validation error",
          message: "Missing item id on line " + (i + 1),
        });
        return;
      }
      if (!location) {
        dialog.alert({
          title: "Validation error",
          message: "Missing location on line " + (i + 1),
        });
        return;
      }

      // If updatequantity provided, ensure it's numeric and not greater than on-hand
      if (
        updatequantity !== null &&
        updatequantity !== "" &&
        !isNaN(updateQtyNum)
      ) {
        if (updateQtyNum > onhandNum) {
          dialog.alert({
            title: "Quantity validation",
            message:
              "Line " +
              (i + 1) +
              ": Update Quantity (" +
              updateQtyNum +
              ") cannot be greater than On Hand (" +
              onhandNum +
              "). Please correct and retry.",
          });
          return;
        }
      } else {
        // If not numeric, treat as no change (you can alter this behavior)
        updatequantity = "";
      }

      // Status validation: if user selected same status as current, skip or notify
      if (
        updatestatus !== null &&
        updatestatus !== "" &&
        String(updatestatus) === String(status)
      ) {
        dialog.alert({
          title: "Status validation",
          message:
            "Line " +
            (i + 1) +
            ": Selected status is the same as the current status. Please pick a different status or leave it blank.",
        });
        return;
      }

      // Add to payload
      data.push({
        location: location,
        itemid: itemid,
        lotnum: lotNum,
        lotnum_text: lotNumText,
        binnum: binNum,
        onhand: onhandNum,
        updatequantity: updatequantity === "" ? "" : updateQtyNum,
        updatestatus: updatestatus === "" ? "" : updatestatus,
        prevStatus: status === "" ? "" : status,
      });
    }

    if (data.length === 0) {
      dialog.alert({
        title: "Nothing selected",
        message: "Please select at least one row to update.",
      });
      return;
    }

    // Confirm with user before sending
    dialog
      .confirm({
        title: "Confirm update",
        message:
          "You are about to update " +
          data.length +
          " selected row(s). Proceed?",
      })
      .then(function (result) {
        // User confirmed (result === true)
        // Disable the button to prevent double submit if button exists in DOM
        try {
          var btn = document.getElementById("custpage_reload");
          if (btn) btn.disabled = true;
        } catch (e) {}

        // Send payload to Suitelet (post to current page)
        var suiteletUrl = window.location.href;

        try {
          var response = https.post({
            url: suiteletUrl,
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json" },
          });

          var body =
            response && response.body ? response.body : String(response);

          // Give user feedback
          dialog
            .alert({
              title: "Update result",
              message: typeof body === "string" ? body : JSON.stringify(body),
            })
            .then(function () {
              // reload page to refresh results
              window.location.reload();
            });
        } catch (err) {
          // If https.post fails, show error
          var msg = err && err.message ? err.message : JSON.stringify(err);
          dialog
            .alert({ title: "Update failed", message: msg })
            .then(function () {
              try {
                if (btn) btn.disabled = false;
              } catch (e) {}
            });
        }
      })
      .catch(function () {
        // User cancelled the confirmation dialog - do nothing
      });
  }

  function pageInit(context) {
    hideInlineEditor();
  }

  function fieldChanged(context) {
    hideInlineEditor();
    console.log("fieldChanged");

    var rec = context.currentRecord;
    var sublistId = context.sublistId;

    if (sublistId == SUBLIST_ID) {
      var fieldId = context.fieldId;
      var line = context.line;

      // do nothing, prevent cursor jump
      if (fieldId === "custpage_update_quantity") {
        // Get entered quantity
        var qty = parseFloat(
          rec.getCurrentSublistValue({
            sublistId: SUBLIST_ID,
            fieldId: fieldId,
          })
        );

        // Get available quantity
        var availableQty = parseFloat(
          rec.getCurrentSublistValue({
            sublistId: SUBLIST_ID,
            fieldId: "custpage_available",
          })
        );

        // Validation: must be a number
        if (isNaN(qty)) {
          dialog.alert({
            title: "Validation error",
            message: "Updated quantity must be a numeric value.",
          });

          rec.setCurrentSublistValue({
            sublistId: SUBLIST_ID,
            fieldId: fieldId,
            value: 0,
            ignoreFieldChange: true,
          });
          return;
        }

        // Validation: must be > 0
        if (qty <= 0) {
          dialog.alert({
            title: "Validation error",
            message: "Updated quantity must be greater than 0.",
          });

          rec.setCurrentSublistValue({
            sublistId: SUBLIST_ID,
            fieldId: fieldId,
            value: 1, // or set to 0 if preferred
            ignoreFieldChange: true,
          });
          return;
        }

        // Validation: must be <= available quantity
        if (qty > availableQty) {
          dialog.alert({
            title: "Validation error",
            message:
              "Updated quantity cannot exceed available quantity (" +
              availableQty +
              ").",
          });

          rec.setCurrentSublistValue({
            sublistId: SUBLIST_ID,
            fieldId: fieldId,
            value: availableQty,
            ignoreFieldChange: true,
          });
          return;
        }
      }
    }

    return;
  }

  function gotoPage() {
    var rec = currentRecord.get();
    var inputPage = rec.getValue({ fieldId: "custpage_goto_page" }) || 1;
    var pageNumber = parseInt(inputPage) - 1; // Convert to zero-based index
    if (isNaN(pageNumber) || pageNumber < 0) pageNumber = 0;

    var url = new URL(window.location.href);
    url.searchParams.set("page", pageNumber);
    window.location.href = url.toString();
  }

  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged,
    performUpdateStatus: performUpdateStatus,
    goNext: goNext,
    goPrev: goPrev,
    gotoPage: gotoPage,
  };
});
