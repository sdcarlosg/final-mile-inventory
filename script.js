document.addEventListener("DOMContentLoaded", () => {
  // --- State Variables ---
  let inventario;
  let empleados = JSON.parse(localStorage.getItem("empleados")) || [];
  const storedData = localStorage.getItem("inventario");
  let adminPasscode = localStorage.getItem("adminPasscode") || "1234";
  let googleSheetsUrl = localStorage.getItem("googleSheetsUrl") || "";
  let currentEditingId = null;
  let isInitialLoadComplete = false;
  let lastBackPress = 0;
  let syncTimeout = null;
  let selectedWizardEmployee = null;
  let pendingWizardItems = [];
  let searchScanner = null;

  // --- DOM References ---
  const form = document.getElementById("inventory-form");
  const fabBtn = document.querySelector(".fab-btn");

  const modal = document.getElementById("edit-modal");
  const addModal = document.getElementById("add-modal");
  const configModal = document.getElementById("config-modal");
  const authModal = document.getElementById("auth-modal");
  const employeeModal = document.getElementById("employee-modal");
  const addEmployeeModal = document.getElementById("add-employee-modal");
  const reportsModal = document.getElementById("reports-modal");
  const statsModal = document.getElementById("stats-modal");
  const remindersModal = document.getElementById("reminders-modal");
  const closeRemindersModalBtn = document.getElementById("close-reminders-modal");
  const remindersDamagedList = document.getElementById("reminders-damaged-list");
  const remindersOverdueList = document.getElementById("reminders-overdue-list");

  const closeModalBtn = document.getElementById("close-modal");
  const cancelEditBtn = document.getElementById("cancel-edit");
  const editForm = document.getElementById("edit-form");
  const editAssignedInput = document.getElementById("edit-assignedTo");
  const editDescInput = document.getElementById("edit-desc");
  const editStatusInput = document.getElementById("edit-status");
  const editNameInput = document.getElementById("edit-name");

  const closeAddModalBtn = document.getElementById("close-add-modal");
  const cancelAddBtn = document.getElementById("cancel-add");

  const closeConfigModalBtn = document.getElementById("close-config-modal");
  const cancelConfigBtn = document.getElementById("cancel-config");
  const configForm = document.getElementById("config-form");
  const sheetsUrlInput = document.getElementById("sheets-url");
  const cloudSyncBtn = document.getElementById("cloud-sync-btn");

  const closeAuthModalBtn = document.getElementById("close-auth-modal");
  const passcodeInput = document.getElementById("passcode-input");
  const authSubmitBtn = document.getElementById("auth-submit-btn");
  const authError = document.getElementById("auth-error");
  const newPasscodeInput = document.getElementById("new-passcode");

  const employeeIdInput = document.getElementById("employee-id-scan");
  const employeeNameInput = document.getElementById("employee-name");
  const employeeListContainer = document.getElementById("employee-list");
  const startEmployeeScanBtn = document.getElementById(
    "start-employee-scan-btn",
  );
  const qrReaderEmployeeDiv = document.getElementById("qr-reader-employee");
  const closeEmployeeModalBtn = document.getElementById("close-employee-modal");
  const employeeForm = document.getElementById("employee-form");
  const employeeMgrBtn = document.getElementById("employee-mgr-btn");
  const inventoryMgrBtn = document.getElementById("inventory-mgr-btn");
  const empSyncIndicator = document.getElementById("employee-sync-indicator");
  const inventorySyncIndicator = document.getElementById(
    "inventory-sync-indicator",
  );
  const openAddEmployeeModalBtn = document.getElementById(
    "open-add-employee-modal-btn",
  );
  const closeAddEmployeeModalBtn = document.getElementById(
    "close-add-employee-modal",
  );
  const employeeSearchInput = document.getElementById("employee-search-input");
  const inventoryMgrSearchInput = document.getElementById(
    "inventory-mgr-search-input",
  );
  const inventoryMgrListContainer =
    document.getElementById("inventory-mgr-list");
  const inventoryMgrModal = document.getElementById("inventory-mgr-modal");
  const closeInventoryMgrModalBtn = document.getElementById(
    "close-inventory-mgr-modal",
  );
  const wizardAvailableItemsContainer = document.getElementById(
    "wizard-available-items",
  );
  const scanSearchInventoryBtn = document.getElementById(
    "scan-search-inventory-btn",
  );
  const scanSearchEmployeeBtn = document.getElementById(
    "scan-search-employee-btn",
  );
  const qrReaderSearchInventoryDiv = document.getElementById(
    "qr-reader-search-inventory",
  );
  const qrReaderSearchEmployeeDiv = document.getElementById(
    "qr-reader-search-employee",
  );

  const availableItemsList = document.getElementById("available-items-list");

  const reportIssueModal = document.getElementById("report-issue-modal");
  const closeReportIssueModalBtn = document.getElementById(
    "close-report-issue-modal",
  );
  const reportIssueForm = document.getElementById("report-issue-form");
  const reportItemSearch = document.getElementById("report-item-search");
  const reportItemsList = document.getElementById("report-items-list");
  const selectedReportItemInput = document.getElementById(
    "selected-report-item",
  );
  const startReportScanBtn = document.getElementById("start-report-scan-btn");
  const reportQrReader = document.getElementById("report-qr-reader");
  const reportNote = document.getElementById("report-note");
  const cancelReportBtn = document.getElementById("cancel-report-btn");
  let selectedReportCondition = "";

  // --- Edit Employee DOM ---
  const editEmployeeModal = document.getElementById("edit-employee-modal");
  const closeEditEmployeeModalBtn = document.getElementById(
    "close-edit-employee-modal",
  );
  const cancelEditEmployeeBtn = document.getElementById("cancel-edit-employee");
  const editEmployeeForm = document.getElementById("edit-employee-form");
  const editEmpIdInput = document.getElementById("edit-emp-id");
  const editEmpNameInput = document.getElementById("edit-emp-name");
  const editEmpPhoneInput = document.getElementById("edit-emp-phone");
  const editOriginalIdInput = document.getElementById("edit-original-id");

  // --- Assignment Wizard DOM ---
  const assignWizardModal = document.getElementById("assign-wizard-modal");
  const closeAssignWizardBtn = document.getElementById("close-assign-wizard");
  const wizardStep1 = document.getElementById("wizard-step-1");
  const wizardStep2 = document.getElementById("wizard-step-2");
  const wizardEmpSearch = document.getElementById("wizard-emp-search");
  const wizardScanBadgeBtn = document.getElementById("wizard-scan-badge-btn");
  const wizardEmpResults = document.getElementById("wizard-emp-results");
  const wizardSelectedEmpSummary = document.getElementById(
    "selected-emp-summary",
  );
  const wizardItemInput = document.getElementById("wizard-item-input");
  const wizardScanItemBtn = document.getElementById("wizard-scan-item-btn");
  const wizardScannedItemsList = document.getElementById("scanned-items-list");
  const wizardConfirmBtn = document.getElementById("wizard-confirm-btn");
  const wizardBackBtn = document.getElementById("wizard-back-btn");
  const wizardQrReaderEmp = document.getElementById("wizard-qr-reader-emp");
  const wizardQrReaderItem = document.getElementById("wizard-qr-reader-item");
  const wizardTitleContainer = document.getElementById(
    "wizard-title-container",
  );
  let wizardScannerBusy = false; // Flag to swallow scanner tail data

  // Helper to apply aggressive attributes to prevent keyboard and autofill
  const applyScanReadyAttributes = (el) => {
    if (!el) return;
    el.setAttribute("inputmode", "none");
    el.setAttribute("autocomplete", "one-time-code");
    el.setAttribute("spellcheck", "false");
    el.setAttribute("autocorrect", "off");
    el.setAttribute("autocapitalize", "none");
    // Dynamic name is the most effective way to confuse Chrome's autofill cache
    el.setAttribute("name", "scan-field-" + Date.now());
  };

  // --- Reinforce Permanent Keyboard Disable for Step 2 Assignment ---
  if (wizardItemInput) {
    // Enforce none on focus and interaction
    ["focus", "click", "mousedown", "touchstart"].forEach((eventType) => {
      wizardItemInput.addEventListener(eventType, () => {
        applyScanReadyAttributes(wizardItemInput);
      });
    });

    // Prevent context menu (Copy, Share, Select All) on this specific field
    wizardItemInput.addEventListener("contextmenu", (e) => e.preventDefault());

    // Prevent long-press selection popups
    wizardItemInput.style.userSelect = "none";
    wizardItemInput.style.webkitUserSelect = "none";

    // NEW: Immediate 'Turbo' intercept for physical scanners
    wizardItemInput.addEventListener("input", (e) => {
      // If already processing a scan, swallow all remaining characters
      if (wizardScannerBusy) {
        wizardItemInput.value = "";
        return;
      }

      const val = wizardItemInput.value;
      if (val.includes("|")) {
        // 1. SILENT INTERCEPT: Extract ID and clear immediately
        const cleanId = val.split("|")[0].trim();
        wizardItemInput.value = ""; // Wipe visually instantly

        // 2. Lock input to swallow the rest of the QR info and potential Enter key
        wizardScannerBusy = true;
        wizardItemInput.readOnly = true;

        // 3. Process the actual ID
        addWizardItem(cleanId);

        // 4. Restore for next scan after the scanner burst finishes (Increased to 1.5s)
        setTimeout(() => {
          if (wizardItemInput) {
            wizardItemInput.readOnly = false;
            wizardItemInput.value = "";
            // Special: ensure focus is maintained without keyboard
            wizardItemInput.setAttribute("inputmode", "none");
          }
          wizardScannerBusy = false;
        }, 1500);
      }
    });

    // Failsafe: block keys during busy mode at the capture level
    wizardItemInput.addEventListener(
      "keydown",
      (e) => {
        if (wizardScannerBusy) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },
      true,
    );
  }

  // --- Dropdown Menu Logic ---
  const moreOptionsBtn = document.getElementById("more-options-btn");
  const moreOptionsMenu = document.getElementById("more-options-menu");
  if (moreOptionsBtn && moreOptionsMenu) {
    moreOptionsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (moreOptionsMenu.classList.contains("hidden")) {
        openModalWithHistory(moreOptionsMenu, "more-options");
      } else {
        closeModalWithHistory();
      }
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !moreOptionsMenu.classList.contains("hidden") &&
        !moreOptionsMenu.contains(e.target) &&
        !moreOptionsBtn.contains(e.target)
      ) {
        // If it was open through history, we might want to pop state,
        // but for click-away simple hiding is usually okay or just let popstate handle it.
        // To be safe and consistent with history:
        if (history.state?.modal === "more-options") {
          history.back();
        } else {
          moreOptionsMenu.classList.add("hidden");
        }
      }
    });
  }

  // --- Dashboard Tiles ---
  const dashAvailable = document.getElementById("dash-available");
  const dashReportIssue = document.getElementById("dash-report-issue");
  const remindersBtn = document.getElementById("reminders-btn");
  const dashAssign = document.getElementById("dash-assign");
  const badgeAvailable = document.getElementById("badge-available");
  const badgeAlerts = document.getElementById("badge-alerts");
  const dashboardStatus = document.getElementById("dashboard-status");

  // --- Core Functions ---
  // Reuse AudioContext for better performance (Smoothness check)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playScanBeep = () => {
    if (audioCtx.state === "suspended") audioCtx.resume();
    const playNote = (freq, start, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtx.currentTime + start + duration,
      );
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + start);
      osc.stop(audioCtx.currentTime + start + duration);
    };
    playNote(1200, 0, 0.05);
    playNote(1600, 0.05, 0.12);
  };

  const playErrorSound = () => {
    if (audioCtx.state === "suspended") audioCtx.resume();
    const playNote = (freq, type, start, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtx.currentTime + start + duration,
      );
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + start);
      osc.stop(audioCtx.currentTime + start + duration);
    };
    // Dissonant low tone for error
    playNote(150, "sawtooth", 0, 0.4);
    playNote(100, "sawtooth", 0.1, 0.4);
  };

  const showCustomConfirm = (message) => {
    return new Promise((resolve) => {
      const modal = document.getElementById("custom-confirm-modal");
      const msgEl = document.getElementById("custom-confirm-message");
      const btnOk = document.getElementById("custom-confirm-ok");
      const btnCancel = document.getElementById("custom-confirm-cancel");

      if (!modal) {
        // Fallback just in case
        resolve(confirm(message));
        return;
      }

      msgEl.textContent = message;
      modal.classList.remove("hidden");

      const handleOk = () => {
        modal.classList.add("hidden");
        cleanup();
        resolve(true);
      };

      const handleCancel = () => {
        modal.classList.add("hidden");
        cleanup();
        resolve(false);
      };

      const cleanup = () => {
        btnOk.removeEventListener("click", handleOk);
        btnCancel.removeEventListener("click", handleCancel);
      };

      btnOk.addEventListener("click", handleOk);
      btnCancel.addEventListener("click", handleCancel);
    });
  };

  const playRemoveBeep = () => {
    if (audioCtx.state === "suspended") audioCtx.resume();
    const playNote = (freq, start, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtx.currentTime + start + duration,
      );
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + start);
      osc.stop(audioCtx.currentTime + start + duration);
    };
    // Sonido descendente para indicar remoción
    playNote(800, 0, 0.05);
    playNote(500, 0.05, 0.12);
  };

  const giveScanFeedback = (elementId) => {
    playScanBeep();
    if (navigator.vibrate) navigator.vibrate(100);
    const el = document.getElementById(elementId);
    if (el) {
      el.classList.add("scan-success-flash");
      setTimeout(() => el.classList.remove("scan-success-flash"), 500);
    }
  };

  const SCANNER_CONFIG = {
    fps: 60,
    aspectRatio: 1.0,
    experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    rememberLastUsedCamera: true,
    formatsToSupport: [
      Html5QrcodeSupportedFormats.QR_CODE,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
    ],
  };

  const checkScanConsistency = (text, buffer) => {
    if (text === buffer.text) {
      buffer.count++;
      return buffer.count >= 1; // Instant match - same as Employee module
    }
    buffer.text = text;
    buffer.count = 1;
    return false;
  };
  const updateDashboardSummary = () => {
    if (!inventario) return;
    const availableCount = inventario.filter(
      (i) => i.status === "AVAILABLE",
    ).length;
    if (badgeAvailable) badgeAvailable.textContent = availableCount;

    const damagedCount = inventario.filter(i => i.condition === "DAMAGED").length;
    let overdueCount = 0;
    const fifteenDaysInMs = 15 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    inventario.forEach(i => {
      if ((i.status === "IN USE" || i.status === "IN-USED") && i.fechaAsignacion) {
        const assignDateMs = new Date(i.fechaAsignacion).getTime();
        if (!isNaN(assignDateMs) && (now - assignDateMs > fifteenDaysInMs)) {
          overdueCount++;
        }
      }
    });

    if (badgeAlerts) badgeAlerts.textContent = (damagedCount + overdueCount).toString();
  };

  const dashReturn = document.getElementById("dash-return");

  const toggleDashboard = (enabled) => {
    const tiles = [dashAvailable, dashReportIssue, dashAssign, dashReturn];
    tiles.forEach((tile) => {
      if (tile) {
        tile.classList.toggle("disabled", !enabled);
      }
    });

    if (dashboardStatus) {
      if (!enabled) {
        const message = googleSheetsUrl
          ? '<i class="ph ph-arrows-clockwise syncing" style="display:inline-block"></i><p>Syncing with Google Sheets...</p>'
          : '<i class="ph ph-lock-key"></i><p style="font-weight: 600;">System Locked - First Use Detected</p><p class="sub-message">To activate the modules, please configure your <b>Google Sheets URL</b> in the settings menu (cloud icon).</p>';
        dashboardStatus.innerHTML = message;
        dashboardStatus.classList.remove("hidden");
      } else {
        dashboardStatus.classList.add("hidden");
        dashboardStatus.innerHTML = "";
      }
    }
  };

  const showToast = (message, type = "normal", duration = 2500) => {
    const toast = document.createElement("div");
    toast.className = `toast-notification ${type === "error" ? "toast-error" : ""}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  };

  const saveToLocalStorage = () => {
    localStorage.setItem("inventario", JSON.stringify(inventario));
    localStorage.setItem("empleados", JSON.stringify(empleados));
    updateAssigneeDatalist();
    updateDashboardSummary();
    if (googleSheetsUrl && isInitialLoadComplete) debouncedSync();
  };

  const debouncedSync = () => {
    if (syncTimeout) clearTimeout(syncTimeout);
    cloudSyncBtn.classList.add("syncing");
    cloudSyncBtn.querySelector("i").className = "ph ph-cloud-arrow-up";
    syncTimeout = setTimeout(() => syncWithGoogleSheets(), 3000);
  };

  const syncWithGoogleSheets = async () => {
    if (!googleSheetsUrl) return;
    cloudSyncBtn.classList.add("syncing");
    cloudSyncBtn.querySelector("i").className = "ph ph-cloud-arrow-up";
    try {
      await fetch(googleSheetsUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync",
          data: inventario,
          employees: empleados,
          passcode: btoa(adminPasscode),
        }),
      });
      cloudSyncBtn.classList.remove("syncing");
      cloudSyncBtn.classList.add("connected");
      cloudSyncBtn.querySelector("i").className = "ph ph-cloud-check";
    } catch (error) {
      console.error("Sync failed:", error);
      cloudSyncBtn.classList.remove("syncing", "connected");
      cloudSyncBtn.querySelector("i").className = "ph ph-cloud-warning";
    }
  };

  window.loadFromGoogleSheets = async (isManualRefresh = false) => {
    if (!googleSheetsUrl) {
      if (isManualRefresh) showToast("Configure Google Sheets first");
      return;
    }

    const refreshBtn = document.getElementById("refresh-data-btn");
    if (refreshBtn && isManualRefresh)
      refreshBtn.querySelector("i").classList.add("ph-spin");

    cloudSyncBtn.classList.add("syncing");
    cloudSyncBtn.querySelector("i").className = "ph ph-cloud-arrow-down";
    [empSyncIndicator, inventorySyncIndicator].forEach((ind) => {
      if (ind) {
        ind.classList.remove("hidden");
        ind.classList.add("syncing");
      }
    });

    try {
      const url = new URL(googleSheetsUrl);
      url.searchParams.set("action", "get");
      url.searchParams.set("t", Date.now());
      const response = await fetch(url.toString());
      const result = await response.json();

      if (result.inventory) {
        inventario = result.inventory.map((item) => ({
          ...item,
          status: (item.status || "AVAILABLE").replace("IN-USED", "IN USE"),
          fechaAsignacion: item.fechaAsignacion || "",
          fechaRetorno: item.fechaRetorno || "",
          lastAssignedTo: item.lastAssignedTo || "",
          lastDateAssigned: item.lastDateAssigned || "",
          lastDateReturned: item.lastDateReturned || ""
        }));
      }
      if (result.employees) {
        empleados = result.employees;
        localStorage.setItem("empleados", JSON.stringify(empleados));
      }
      if (result.passcode) {
        try {
          adminPasscode = atob(result.passcode);
          localStorage.setItem("adminPasscode", adminPasscode);
        } catch (e) {
          console.error("Error decoding cloud passcode");
        }
      }
      localStorage.setItem("inventario", JSON.stringify(inventario));
      isInitialLoadComplete = true;
      renderEmpleados();
      renderInventoryMgrList();
      updateAssigneeDatalist();
      updateDashboardSummary();
      toggleDashboard(true);
      cloudSyncBtn.classList.remove("syncing");
      cloudSyncBtn.classList.add("connected");
      cloudSyncBtn.querySelector("i").className = "ph ph-cloud-check";
      if (isManualRefresh) showToast("Data refreshed successfully");
    } catch (error) {
      console.error("Load failed:", error);
      cloudSyncBtn.classList.remove("syncing");
      cloudSyncBtn.classList.add("connected");
      cloudSyncBtn.querySelector("i").className = "ph ph-cloud-warning";
      if (grid) {
        grid.innerHTML =
          '<div class="empty-state"><i class="ph ph-warning-circle" style="color: var(--danger)"></i><p>Cloud connection failed. Refresh to try again.</p></div>';
      }
      // Even if cloud fails, let's allow editing with local data so user isn't blocked
      if (storedData) {
        inventario = JSON.parse(storedData);
        renderEmpleados();
        renderInventoryMgrList();
        updateAssigneeDatalist();
        isInitialLoadComplete = true;
      }
      if (isManualRefresh) showToast("Failed to refresh data", "error");
    } finally {
      if (refreshBtn) refreshBtn.querySelector("i").classList.remove("ph-spin");
      [empSyncIndicator, inventorySyncIndicator].forEach((ind) => {
        if (ind) {
          ind.classList.remove("syncing");
          ind.classList.add("hidden");
        }
      });
    }
  };

  // --- Initialization ---
  const init = async () => {
    if (storedData) {
      inventario = JSON.parse(storedData).map((item) => ({
        ...item,
        status: (item.status || "AVAILABLE").replace("IN-USED", "IN USE"),
        fechaAsignacion: item.fechaAsignacion || "",
        fechaRetorno: item.fechaRetorno || "",
      }));
    } else {
      inventario = [];
    }

    if (googleSheetsUrl) {
      cloudSyncBtn.classList.add("connected");
      cloudSyncBtn.querySelector("i").className = "ph ph-cloud-check";
      toggleDashboard(false); // This will show the "Syncing" message defined in toggleDashboard
      await loadFromGoogleSheets();
    } else {
      isInitialLoadComplete = true;
      toggleDashboard(false);
      if (inventario.length === 0) {
        if (fabBtn) fabBtn.style.display = "none";
        [employeeMgrBtn, inventoryMgrBtn, moreOptionsBtn].forEach((btn) => {
          if (btn) {
            btn.style.opacity = "0.3";
            btn.style.pointerEvents = "none";
          }
        });
      } else {
        renderEmpleados();
        updateAssigneeDatalist();
        updateDashboardSummary();
      }
    }
  };
  init();

  // --- History & Navigation Logic ---
  const stopScanner = () => {
    if (html5QrcodeScanner) {
      html5QrcodeScanner
        .stop()
        .then(() => {
          qrReaderDiv.style.display = "none";
          startScanBtn.innerHTML = '<i class="ph ph-qr-code"></i> Scan';
          html5QrcodeScanner.clear();
          html5QrcodeScanner = null;
          if (addModal && !addModal.classList.contains("hidden")) {
            setTimeout(() => {
              const idScanInput = document.getElementById("item-id-scan");
              if (idScanInput) {
                if (typeof focusWithoutKeyboard === "function") {
                  focusWithoutKeyboard(idScanInput);
                } else {
                  idScanInput.focus();
                }
              }
            }, 100);
          }
        })
        .catch((e) => console.error(e));
    }
  };

  const stopEmployeeScanner = () => {
    if (employeeScanner) {
      employeeScanner
        .stop()
        .then(() => {
          qrReaderEmployeeDiv.style.display = "none";
          startEmployeeScanBtn.innerHTML = '<i class="ph ph-qr-code"></i> Scan';
          employeeScanner.clear();
          employeeScanner = null;
          if (
            addEmployeeModal &&
            !addEmployeeModal.classList.contains("hidden")
          ) {
            setTimeout(() => {
              const idScanInput = document.getElementById("employee-id-scan");
              if (idScanInput) {
                if (typeof focusWithoutKeyboard === "function") {
                  focusWithoutKeyboard(idScanInput);
                } else {
                  idScanInput.focus();
                }
              }
            }, 100);
          }
        })
        .catch((e) => console.error(e));
    }
  };

  const stopAllScanners = () => {
    stopScanner();
    stopEmployeeScanner();
    stopWizardScanner();
    stopSearchScanner();
    stopReturnScanner();
    if (typeof stopReportScanner === "function") stopReportScanner();
  };

  const stopSearchScanner = () => {
    if (searchScanner) {
      searchScanner
        .stop()
        .then(() => {
          qrReaderSearchInventoryDiv.style.display = "none";
          qrReaderSearchEmployeeDiv.style.display = "none";
          if (scanSearchInventoryBtn)
            scanSearchInventoryBtn.innerHTML =
              '<i class="ph ph-qr-code"></i> Scan';
          if (scanSearchEmployeeBtn)
            scanSearchEmployeeBtn.innerHTML = '<i class="ph ph-qr-code"></i>';
          searchScanner.clear();
          searchScanner = null;
        })
        .catch((e) => console.error(e));
    }
  };

  const openModalWithHistory = (modalElement, stateId) => {
    if (history.state?.modal !== stateId) {
      history.pushState({ modal: stateId }, null, "");
    }
    modalElement.classList.remove("hidden");
  };

  const closeModalWithHistory = () => {
    if (history.state && history.state.modal !== "home") {
      history.back();
    } else {
      const allModals = [
        addModal,
        modal,
        configModal,
        authModal,
        employeeModal,
        inventoryMgrModal,
        reportIssueModal,
        addEmployeeModal,
        editEmployeeModal,
        assignWizardModal,
        returnWizardModal,
        reportsModal,
        statsModal,
        document.getElementById("report-emp-list-modal"),
        document.getElementById("report-risk-modal"),
        document.getElementById("report-movements-modal"),
        remindersModal,
        moreOptionsMenu,
      ].filter((m) => m !== null && m !== undefined);

      allModals.forEach((m) => {
        m.classList.add("hidden");
      });
      stopAllScanners();
    }
  };

  window.addEventListener("popstate", (event) => {
    const targetState = history.state?.modal || "home";
    const modals = [
      addModal,
      modal,
      configModal,
      authModal,
      employeeModal,
      inventoryMgrModal,
      addEmployeeModal,
      editEmployeeModal,
      reportIssueModal,
      assignWizardModal,
      returnWizardModal,
      reportsModal,
      statsModal,
      document.getElementById("report-emp-list-modal"),
      document.getElementById("report-risk-modal"),
      document.getElementById("report-movements-modal"),
      remindersModal,
      moreOptionsMenu,
    ].filter((m) => m !== null && m !== undefined);

    if (
      [
        "employee-modal",
        "inventory-mgr-modal",
        "report-issue-modal",
        "assign-wizard",
        "reports-modal",
        "stats-modal",
        "report-emp-list-modal",
        "report-risk-modal",
        "report-movements-modal",
        "reminders-modal",
        "more-options",
      ].includes(targetState)
    ) {
      modals.forEach((m) => m.classList.add("hidden"));
      if (targetState === "employee-modal" && employeeModal)
        employeeModal.classList.remove("hidden");
      else if (targetState === "inventory-mgr-modal" && inventoryMgrModal)
        inventoryMgrModal.classList.remove("hidden");
      else if (targetState === "report-issue-modal" && reportIssueModal)
        reportIssueModal.classList.remove("hidden");
      else if (targetState === "reports-modal" && reportsModal)
        reportsModal.classList.remove("hidden");
      else if (targetState === "reminders-modal" && remindersModal)
        remindersModal.classList.remove("hidden");
      else if (targetState === "more-options" && moreOptionsMenu)
        moreOptionsMenu.classList.remove("hidden");
      else if (targetState === "report-emp-list-modal") {
        const m = document.getElementById("report-emp-list-modal");
        if (m) m.classList.remove("hidden");
      } else if (targetState === "report-risk-modal") {
        const m = document.getElementById("report-risk-modal");
        if (m) m.classList.remove("hidden");
      } else if (targetState === "report-movements-modal") {
        const m = document.getElementById("report-movements-modal");
        if (m) m.classList.remove("hidden");
      } else if (targetState === "stats-modal" && statsModal)
        statsModal.classList.remove("hidden");
      else if (targetState === "assign-wizard" && assignWizardModal) {
        assignWizardModal.classList.remove("hidden");
        goToWizardStep1(false);
      } else if (targetState === "assign-wizard-step2" && assignWizardModal) {
        assignWizardModal.classList.remove("hidden");
        if (typeof wizardStep1 !== "undefined")
          wizardStep1.classList.add("hidden");
        if (typeof wizardStep2 !== "undefined")
          wizardStep2.classList.remove("hidden");
      }
      stopEmployeeScanner();
      stopWizardScanner();
      if (typeof stopReportScanner === "function") stopReportScanner();
      return;
    }

    if (["return-wizard"].includes(targetState) && returnWizardModal) {
      modals.forEach((m) => m.classList.add("hidden"));
      returnWizardModal.classList.remove("hidden");
      if (typeof goToReturnStep1 === "function") goToReturnStep1(false);
      return;
    }

    if (
      ["return-wizard-step2"].includes(targetState) &&
      returnWizardModal
    ) {
      modals.forEach((m) => m.classList.add("hidden"));
      returnWizardModal.classList.remove("hidden");
      if (typeof returnInfoStep !== "undefined")
        returnInfoStep.classList.add("hidden");
      if (typeof returnItemStep !== "undefined")
        returnItemStep.classList.remove("hidden");
      if (typeof stopReturnScanner === "function") stopReturnScanner();
      return;
    }

    const anyModalVisible = modals.some((m) => !m.classList.contains("hidden"));

    if (anyModalVisible) {
      modals.forEach((m) => m.classList.add("hidden"));
      currentEditingId = null;
      stopAllScanners();
      stopWizardScanner();
      if (!history.state || history.state.modal !== "home") {
        history.pushState({ modal: "home" }, null, "");
      }
    } else {
      const now = Date.now();
      if (now - lastBackPress > 2000) {
        lastBackPress = now;
        showToast("Press back again to exit");
        history.pushState({ modal: "home" }, null, "");
      }
    }
  });

  if (history.state?.modal !== "home") {
    history.replaceState({ modal: "home" }, null, "");
    history.pushState({ modal: "home" }, null, "");
  }

  // --- Inventory Event Listeners ---
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nomeEl = document.getElementById("itemName");
    const descEl = document.getElementById("itemDesc");

    const nombre = nomeEl ? nomeEl.value : "";
    const descripcion = descEl ? descEl.value : "";
    const asignadoA = " NONE";
    const status = "AVAILABLE";

    const scannedId = document.getElementById("item-id-scan").value.trim();
    const finalId = scannedId ? scannedId : Date.now();
    const exists = inventario.some(
      (item) => String(item.id) === String(finalId),
    );

    if (exists) {
      showToast("Asset ID already exist", "error");
      playErrorSound();
      const idScanInput = document.getElementById("item-id-scan");
      if (idScanInput) {
        idScanInput.value = "";
        if (typeof focusWithoutKeyboard === "function") {
          focusWithoutKeyboard(idScanInput);
        } else {
          idScanInput.focus();
        }
      }
      return;
    }

    const newItem = {
      id: finalId,
      nombre,
      descripcion: descripcion || "No description",
      asignadoA: asignadoA,
      status: status,
      fecha: new Date().toLocaleDateString(),
      fechaAsignacion: "",
      fechaRetorno: "",
    };

    inventario.unshift(newItem);
    saveToLocalStorage();
    renderInventoryMgrList();

    // Reset Form for next entry
    form.reset();
    const idScanInput = document.getElementById("item-id-scan");
    if (idScanInput) {
      idScanInput.style.borderColor = "var(--border)";
      idScanInput.style.boxShadow = "none";
      if (typeof focusWithoutKeyboard === "function") {
        focusWithoutKeyboard(idScanInput);
      } else {
        idScanInput.focus();
      }
    }

    // Reset button state
    toggleAddFields(false);
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.style.opacity = "0.5";
    btn.style.cursor = "not-allowed";

    showToast("Item Added Successfully");
  });

  const toggleAddFields = (enable) => {
    ["itemName", "itemDesc"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.disabled = !enable;
        el.style.opacity = enable ? "1" : "0.5";
        el.style.cursor = enable ? "text" : "not-allowed";
      }
    });
  };

  const submitBtn = form.querySelector('button[type="submit"]');
  window.abrirAddModal = () => {
    openModalWithHistory(addModal, "add-modal");
    const idInput = document.getElementById("item-id-scan");
    if (idInput) {
      idInput.style.borderColor = "var(--border)";
      idInput.style.boxShadow = "none";
      idInput.value = "";
      focusWithoutKeyboard(idInput);
    }
    toggleAddFields(false);
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.5";
    submitBtn.style.cursor = "not-allowed";

    // -- Web Version Check: Disable Camera in New Item for Desktop --
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    const isWebVersion = !isMobileDevice;

    if (isWebVersion) {
      if (startScanBtn) startScanBtn.style.display = "none";
    } else {
      if (startScanBtn) startScanBtn.style.display = "flex";
    }
  };

  const validateFormCompletion = () => {
    const idVal = document.getElementById("item-id-scan").value.trim();
    const nameVal = document.getElementById("itemName").value.trim();
    const startsWithFINL = idVal.startsWith("FINL");
    const exists = inventario.some((item) => String(item.id) === idVal);
    const isIdValid = idVal && startsWithFINL && !exists;

    if (isIdValid && nameVal) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.style.cursor = "pointer";
    } else {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.5";
      submitBtn.style.cursor = "not-allowed";
    }
  };

  ["itemName"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", validateFormCompletion);
  });

  const validateIdInput = () => {
    const idScanInput = document.getElementById("item-id-scan");
    const val = idScanInput.value.trim();
    if (!val) {
      idScanInput.style.borderColor = "var(--border)";
      idScanInput.style.boxShadow = "none";
      toggleAddFields(false);
      validateFormCompletion();
      return;
    }
    const startsWithFINL = val.startsWith("FINL");
    const exists = inventario.some((item) => String(item.id) === val);
    if (startsWithFINL && !exists) {
      idScanInput.style.borderColor = "var(--success)";
      idScanInput.style.boxShadow = "none";
      toggleAddFields(true);
    } else {
      if (exists) {
        showToast("Asset ID already exist", "error");
        playErrorSound();
        idScanInput.value = "";
        setTimeout(() => {
          if (typeof focusWithoutKeyboard === "function") {
            focusWithoutKeyboard(idScanInput);
          } else {
            idScanInput.focus();
          }
        }, 100);
      }
      idScanInput.style.borderColor = "var(--danger)";
      idScanInput.style.boxShadow = "0 0 0 2px rgba(239, 68, 68, 0.2)";
      toggleAddFields(false);
    }
    validateFormCompletion();
  };

  document
    .getElementById("item-id-scan")
    .addEventListener("input", validateIdInput);

  const closeAddModal = () => {
    closeModalWithHistory();
    form.reset();
    submitBtn.disabled = false;
    submitBtn.style.opacity = "1";

    if (inventoryMgrSearchInput && typeof focusWithoutKeyboard === "function") {
      focusWithoutKeyboard(inventoryMgrSearchInput);
    } else if (inventoryMgrSearchInput) {
      inventoryMgrSearchInput.focus();
    }
  };

  closeAddModalBtn.addEventListener("click", closeAddModal);
  cancelAddBtn.addEventListener("click", closeAddModal);
  addModal.addEventListener("click", (e) => {
    if (e.target === addModal) closeAddModal();
  });

  // --- QR Scanner Logic ---
  let html5QrcodeScanner = null;
  const startScanBtn = document.getElementById("start-scan-btn");
  const qrReaderDiv = document.getElementById("qr-reader");
  let lastScanResult = { text: "", count: 0 };

  startScanBtn.addEventListener("click", () => {
    if (qrReaderDiv.style.display === "none") {
      if (typeof Html5Qrcode === "undefined") {
        alert("QR Library not loaded. Please check internet connection.");
        return;
      }
      qrReaderDiv.style.display = "block";
      startScanBtn.innerHTML = '<i class="ph ph-stop"></i> Stop';
      html5QrcodeScanner = new Html5Qrcode("qr-reader");
      const config = { ...SCANNER_CONFIG, qrbox: { width: 250, height: 250 } };

      const onScanSuccessLocal = (text) => {
        if (!checkScanConsistency(text, lastScanResult)) return;

        giveScanFeedback("qr-reader");
        // Reset buffer safely by reusing object or just clearing text/count logic internally if needed,
        // but here we just proceed. The consistency check handles the counter.
        // To allow re-scanning same item immediately after success, we reset:
        lastScanResult.text = "";
        lastScanResult.count = 0;

        // Unified Clean Parse
        const { id, name, desc } = parseAssetData(text);

        if (!id.startsWith("FINL")) {
          showToast("Wrong Asset ID", "error");
          playErrorSound();
          stopScanner();
          return;
        }
        if (inventario.some((item) => String(item.id) === String(id))) {
          showToast("Asset ID already exist", "error");
          playErrorSound();
          const idScanInput = document.getElementById("item-id-scan");
          if (idScanInput) {
            idScanInput.value = "";
          }
          stopScanner();
          return;
        }

        document.getElementById("item-id-scan").value = id;
        if (name) document.getElementById("itemName").value = name;
        if (desc) document.getElementById("itemDesc").value = desc;
        validateIdInput();
        stopScanner();
      };

      html5QrcodeScanner
        .start({ facingMode: "environment" }, config, onScanSuccessLocal)
        .catch(() =>
          html5QrcodeScanner
            .start({ facingMode: "user" }, config, onScanSuccessLocal)
            .catch(() => {
              alert("Could not start camera");
              stopScanner();
            }),
        );
    } else stopScanner();
  });

  // --- Global Functions ---
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };
  // --- Helper: Focus without opening keyboard (for scanner readiness) ---
  // User can tap the field again to open keyboard manually.
  const focusWithoutKeyboard = (el) => {
    if (!el) return;
    // 1. Disable keyboard
    el.setAttribute("inputmode", "none");
    el.focus();

    // 2. Add listener to restore keyboard on user interaction (click/tap)
    const enableKeyboard = () => {
      el.removeAttribute("inputmode");
      // Force redraw/recognition of change if needed, but attribute removal usually works on next focus or immediately
      // Sometimes need to blur and refocus, but simple removal is safer for UX flow.
    };

    // Remove 'inputmode' when user clicks the field
    el.addEventListener("click", enableKeyboard, { once: true });

    // Also remove if checking out and back in
    el.addEventListener(
      "blur",
      () => {
        el.removeAttribute("inputmode");
        el.removeEventListener("click", enableKeyboard);
      },
      { once: true },
    );
  };

  window.eliminarItem = async (id) => {
    const itemToCheck = inventario.find((i) => String(i.id) === String(id));
    if (itemToCheck) {
      const status = (itemToCheck.status || "AVAILABLE").replace(
        "IN-USED",
        "IN USE",
      );
      if (status === "IN USE") {
        showToast("Cannot delete an item that is IN USE.", "error");
        playErrorSound();
        return;
      }
    }

    const confirmed = await showCustomConfirm(
      "Are you sure you want to delete this item?",
    );
    if (confirmed) {
      inventario = inventario.filter((item) => String(item.id) !== String(id));
      saveToLocalStorage();
      renderInventoryMgrList();
    }
  };

  window.abrirModal = (id) => {
    const item = inventario.find((i) => String(i.id) === String(id));
    if (!item) return;
    currentEditingId = id;
    editNameInput.value = item.nombre;
    editAssignedInput.value = item.asignadoA;
    editDescInput.value = item.descripcion;
    const statusValue = (item.status || "IN USE").replace("IN-USED", "IN USE");
    editStatusInput.value = statusValue;
    editStatusInput.style.color =
      statusValue === "AVAILABLE" ? "#ffd700" : "var(--success)";

    // Hide manager modal so the editor (which is higher in DOM) is visible
    openModalWithHistory(modal, "edit-modal");
  };

  const closeModal = () => {
    closeModalWithHistory();
    currentEditingId = null;
  };
  closeModalBtn.addEventListener("click", closeModal);
  cancelEditBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  editStatusInput.addEventListener("click", () => {
    const val = editAssignedInput.value.trim().toUpperCase();
    if (editStatusInput.value === "AVAILABLE") {
      if (val === "NONE" || val === "") {
        showToast("Assign someone first.", "error");
        playErrorSound();
        return;
      }
      editStatusInput.value = "IN USE";
      editStatusInput.style.color = "var(--success)";
    } else {
      editStatusInput.value = "AVAILABLE";
      editStatusInput.style.color = "#ffd700";
    }
  });

  editAssignedInput.addEventListener("input", () => {
    const val = editAssignedInput.value.toUpperCase().trim();
    if (val === "NONE" || val === "") {
      editStatusInput.value = "AVAILABLE";
      editStatusInput.style.color = "#ffd700";
    } else if (editStatusInput.value === "AVAILABLE") {
      editStatusInput.value = "IN USE";
      editStatusInput.style.color = "var(--success)";
    }
  });

  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const itemIndex = inventario.findIndex(
      (i) => String(i.id) === String(currentEditingId),
    );
    if (itemIndex > -1) {
      let newAssignedTo = editAssignedInput.value.trim() || " NONE";
      if (
        newAssignedTo.toUpperCase() === "NONE" &&
        editStatusInput.value === "IN USE"
      ) {
        showToast("Cannot be IN USE without assignee.", "error");
        playErrorSound();
        return;
      }
      if (
        newAssignedTo.toUpperCase() !== "NONE" &&
        inventario[itemIndex].asignadoA !== newAssignedTo
      ) {
        if (inventario[itemIndex].asignadoA && inventario[itemIndex].asignadoA.trim().toUpperCase() !== "NONE") {
          inventario[itemIndex].lastAssignedTo = inventario[itemIndex].asignadoA;
          inventario[itemIndex].lastDateAssigned = inventario[itemIndex].fechaAsignacion;
          inventario[itemIndex].lastDateReturned = new Date().toLocaleDateString();
        }
        inventario[itemIndex].fechaAsignacion = new Date().toLocaleDateString();
        inventario[itemIndex].fechaRetorno = "";
        inventario[itemIndex].condition = "";
        inventario[itemIndex].incidentNote = "";
      } else if (
        newAssignedTo.toUpperCase() === "NONE" &&
        inventario[itemIndex].asignadoA.toUpperCase() !== "NONE"
      ) {
        inventario[itemIndex].lastAssignedTo = inventario[itemIndex].asignadoA;
        inventario[itemIndex].lastDateAssigned = inventario[itemIndex].fechaAsignacion;
        inventario[itemIndex].lastDateReturned = new Date().toLocaleDateString();

        inventario[itemIndex].fechaRetorno = new Date().toLocaleDateString();
        inventario[itemIndex].fechaAsignacion = "";
        inventario[itemIndex].condition = "";
        inventario[itemIndex].incidentNote = "";
      }
      inventario[itemIndex].nombre = editNameInput.value;
      inventario[itemIndex].asignadoA = newAssignedTo;
      inventario[itemIndex].descripcion = editDescInput.value;
      inventario[itemIndex].status = editStatusInput.value;
      saveToLocalStorage();
      renderInventoryMgrList();
      closeModal();
    }
  });

  // --- Auth & Config ---
  window.abrirConfigModal = () => {
    passcodeInput.value = "";
    authError.classList.add("hidden");
    openModalWithHistory(authModal, "auth-modal");
    passcodeInput.focus();
  };

  const handleAuthSubmit = () => {
    if (passcodeInput.value === adminPasscode) {
      history.replaceState({ modal: "config-modal" }, null, "");
      authModal.classList.add("hidden");
      sheetsUrlInput.value = googleSheetsUrl;
      newPasscodeInput.value = "";
      configModal.classList.remove("hidden");
    } else {
      authError.classList.remove("hidden");
      passcodeInput.value = "";
    }
  };
  authSubmitBtn.addEventListener("click", handleAuthSubmit);
  passcodeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleAuthSubmit();
  });

  closeAuthModalBtn.addEventListener("click", closeModalWithHistory);
  authModal.addEventListener("click", (e) => {
    if (e.target === authModal) closeModalWithHistory();
  });

  const closeConfigModal = () => closeModalWithHistory();
  closeConfigModalBtn.addEventListener("click", closeConfigModal);
  cancelConfigBtn.addEventListener("click", closeConfigModal);

  configForm.addEventListener("submit", (e) => {
    e.preventDefault();
    googleSheetsUrl = sheetsUrlInput.value.trim();
    localStorage.setItem("googleSheetsUrl", googleSheetsUrl);
    const newPass = newPasscodeInput.value.trim();
    if (newPass.length === 4) {
      adminPasscode = newPass;
      localStorage.setItem("adminPasscode", adminPasscode);
      if (googleSheetsUrl) syncWithGoogleSheets();
    } else if (newPass.length > 0) {
      alert("Passcode must be 4 digits.");
      return;
    }

    if (googleSheetsUrl) {
      cloudSyncBtn.classList.add("connected");
      cloudSyncBtn.querySelector("i").className = "ph ph-cloud-slash";
      isInitialLoadComplete = false;
      if (fabBtn) fabBtn.style.display = "flex";
      [employeeMgrBtn, inventoryMgrBtn, moreOptionsBtn].forEach((btn) => {
        if (btn) {
          btn.style.opacity = "1";
          btn.style.pointerEvents = "all";
        }
      });
      loadFromGoogleSheets();
    } else {
      cloudSyncBtn.classList.remove("connected");
      cloudSyncBtn.querySelector("i").className = "ph ph-cloud-slash";
      toggleDashboard(false);
    }
    closeModalWithHistory();
  });

  // --- Employees ---
  let employeeScanner = null;
  window.abrirEmpleadoModal = () => {
    employeeSearchInput.value = ""; // Reset search on open
    openModalWithHistory(employeeModal, "employee-modal");
    focusWithoutKeyboard(employeeSearchInput);
    renderEmpleados();
    if (googleSheetsUrl) loadFromGoogleSheets();
  };

  const closeEmployeeModal = () => {
    closeModalWithHistory();
  };
  closeEmployeeModalBtn.addEventListener("click", closeEmployeeModal);
  const cancelEmployeeMgrBtn = document.getElementById(
    "cancel-employee-mgr-btn",
  );
  if (cancelEmployeeMgrBtn)
    cancelEmployeeMgrBtn.addEventListener("click", closeEmployeeModal);

  employeeModal.addEventListener("click", (e) => {
    if (e.target === employeeModal) closeEmployeeModal();
  });

  const openAddEmployeeModal = () => {
    resetEmployeeForm();
    openModalWithHistory(addEmployeeModal, "add-employee-modal");
    focusWithoutKeyboard(employeeIdInput);

    // -- Web Version Check: Disable Camera in Add Employee for Desktop --
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    const isWebVersion = !isMobileDevice;

    if (isWebVersion) {
      if (startEmployeeScanBtn) startEmployeeScanBtn.style.display = "none";
    } else {
      if (startEmployeeScanBtn) startEmployeeScanBtn.style.display = "flex";
    }
  };

  const closeAddEmployeeModal = () => {
    closeModalWithHistory();
    resetEmployeeForm();
    if (employeeSearchInput && typeof focusWithoutKeyboard === "function") {
      focusWithoutKeyboard(employeeSearchInput);
    } else if (employeeSearchInput) {
      employeeSearchInput.focus();
    }
  };

  const cancelAddEmployeeBtn = document.getElementById("cancel-add-employee");
  if (openAddEmployeeModalBtn)
    openAddEmployeeModalBtn.addEventListener("click", openAddEmployeeModal);
  if (closeAddEmployeeModalBtn)
    closeAddEmployeeModalBtn.addEventListener("click", closeAddEmployeeModal);
  if (cancelAddEmployeeBtn)
    cancelAddEmployeeBtn.addEventListener("click", closeAddEmployeeModal);
  addEmployeeModal.addEventListener("click", (e) => {
    if (e.target === addEmployeeModal) closeAddEmployeeModal();
  });

  startEmployeeScanBtn.addEventListener("click", () => {
    if (qrReaderEmployeeDiv.style.display === "none") {
      employeeIdInput.value = "";
      employeeNameInput.value = "";
      validateEmployeeForm();
      qrReaderEmployeeDiv.style.display = "block";
      startEmployeeScanBtn.innerHTML = '<i class="ph ph-stop"></i> Stop';
      employeeScanner = new Html5Qrcode("qr-reader-employee");
      const handleEmpScan = (text) => {
        giveScanFeedback("qr-reader-employee");
        const cleanText = text.trim();
        const idExists = empleados.some((emp) => String(emp.id) === cleanText);
        if (idExists) {
          showToast("Employee ID already exists", "error");
          playErrorSound();
          employeeIdInput.value = "";
          validateEmployeeForm();
          stopEmployeeScanner();
          return;
        }
        employeeIdInput.value = cleanText;
        validateEmployeeForm();
        stopEmployeeScanner();
      };
      const scanConfig = {
        ...SCANNER_CONFIG,
        qrbox: { width: 300, height: 150 },
      };
      employeeScanner
        .start({ facingMode: "environment" }, scanConfig, handleEmpScan)
        .catch(() =>
          employeeScanner.start(
            { facingMode: "user" },
            scanConfig,
            handleEmpScan,
          ),
        );
    } else stopEmployeeScanner();
  });

  const employeePhoneInput = document.getElementById("employee-phone");

  const validateEmployeeForm = () => {
    const id = employeeIdInput.value.trim();
    const name = employeeNameInput.value.trim();
    const phone = employeePhoneInput.value.trim();
    const phoneDigits = phone.replace(/\D/g, "").length;

    const idExists =
      id !== "" && empleados.some((emp) => String(emp.id) === String(id));
    const nameExists =
      name !== "" &&
      empleados.some((emp) => emp.name.toUpperCase() === name.toUpperCase());
    const phoneExists =
      phoneDigits > 0 && empleados.some((emp) => emp.phone === phone);

    const isIdValid = !idExists && /^\d{8}$/.test(id);
    const isNameValid = !nameExists && name.length >= 2;
    const isPhoneValid = !phoneExists && phoneDigits === 10;

    const setFieldStyle = (el, isValid, hasContent) => {
      el.style.borderColor = isValid
        ? "var(--success)"
        : hasContent
          ? "var(--danger)"
          : "var(--border)";
    };

    setFieldStyle(employeeIdInput, isIdValid, id.length > 0);
    setFieldStyle(employeeNameInput, isNameValid, name.length > 0);
    setFieldStyle(employeePhoneInput, isPhoneValid, phoneDigits > 0);

    const idErr = document.getElementById("emp-id-error");
    idErr.textContent = idExists
      ? "Employee ID already exists"
      : "ID must be exactly 8 digits";
    idErr.classList.toggle("hidden", isIdValid || id.length === 0);

    document
      .getElementById("emp-name-error")
      .classList.toggle("hidden", !nameExists);

    const phoneErr = document.getElementById("emp-phone-error");
    phoneErr.textContent = phoneExists
      ? "Phone already exists"
      : "Phone must be 10 digits";
    phoneErr.classList.toggle("hidden", isPhoneValid || phoneDigits === 0);

    const isValid = isIdValid && isNameValid && isPhoneValid;
    const btn = employeeForm.querySelector('button[type="submit"]');
    btn.disabled = !isValid;
    btn.style.opacity = isValid ? "1" : "0.5";
  };

  const resetEmployeeForm = () => {
    employeeForm.reset();
    employeeIdInput.style.borderColor = "var(--border)";
    employeeNameInput.style.borderColor = "var(--border)";
    employeePhoneInput.style.borderColor = "var(--border)";
    document.getElementById("emp-id-error").classList.add("hidden");
    document.getElementById("emp-name-error").classList.add("hidden");
    document.getElementById("emp-phone-error").classList.add("hidden");
    validateEmployeeForm();
  };

  employeeIdInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
    validateEmployeeForm();
  });
  employeeNameInput.addEventListener("input", validateEmployeeForm);
  employeePhoneInput.addEventListener("input", (e) => {
    let x = e.target.value
      .replace(/\D/g, "")
      .match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
    e.target.value = !x[2]
      ? x[1]
      : "(" + x[1] + ")-" + x[2] + (x[3] ? "-" + x[3] : "");
    validateEmployeeForm();
  });

  employeeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = employeeIdInput.value.trim();
    const name = employeeNameInput.value.trim();
    const phone = employeePhoneInput.value.trim();

    if (
      empleados.some(
        (emp) =>
          String(emp.id) === String(id) ||
          emp.name.toUpperCase() === name.toUpperCase() ||
          (phone && emp.phone === phone),
      )
    )
      return;

    empleados.unshift({ id, name, phone });
    saveToLocalStorage();
    renderEmpleados();
    const btn = employeeForm.querySelector('button[type="submit"]');
    const oldText = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-check"></i> Added';
    setTimeout(() => {
      btn.innerHTML = oldText;
      resetEmployeeForm();
      if (addEmployeeModal && !addEmployeeModal.classList.contains("hidden")) {
        if (typeof focusWithoutKeyboard === "function") {
          focusWithoutKeyboard(employeeIdInput);
        } else {
          employeeIdInput.focus();
        }
      }
    }, 800);
  });

  // --- Edit Employee Logic ---
  window.abrirEditarEmpleado = (id) => {
    const emp = empleados.find((e) => String(e.id) === String(id));
    if (!emp) return;

    editOriginalIdInput.value = emp.id;
    editEmpIdInput.value = emp.id;
    editEmpNameInput.value = emp.name;
    editEmpPhoneInput.value = emp.phone || "";

    // Reset errors
    document.getElementById("edit-emp-id-error").classList.add("hidden");
    document.getElementById("edit-emp-name-error").classList.add("hidden");
    document.getElementById("edit-emp-phone-error").classList.add("hidden");

    // Hide employee manager so the editor is visible
    employeeModal.classList.add("hidden");

    openModalWithHistory(editEmployeeModal, "edit-employee-modal");
  };

  const closeEditEmployeeModal = () => {
    closeModalWithHistory();
  };

  closeEditEmployeeModalBtn.addEventListener("click", closeEditEmployeeModal);
  cancelEditEmployeeBtn.addEventListener("click", closeEditEmployeeModal);
  editEmployeeModal.addEventListener("click", (e) => {
    if (e.target === editEmployeeModal) closeEditEmployeeModal();
  });

  // Phone formatter for edit
  editEmpPhoneInput.addEventListener("input", (e) => {
    let x = e.target.value
      .replace(/\D/g, "")
      .match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
    e.target.value = !x[2]
      ? x[1]
      : "(" + x[1] + ")-" + x[2] + (x[3] ? "-" + x[3] : "");
  });

  editEmpIdInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });

  editEmployeeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const originalId = editOriginalIdInput.value;
    const newId = editEmpIdInput.value.trim();
    const newName = editEmpNameInput.value.trim();
    const newPhone = editEmpPhoneInput.value.trim();

    // Validation
    const idExists = empleados.some(
      (emp) =>
        String(emp.id) === String(newId) &&
        String(emp.id) !== String(originalId),
    );
    const nameExists = empleados.some(
      (emp) =>
        emp.name.toUpperCase() === newName.toUpperCase() &&
        String(emp.id) !== String(originalId),
    );
    const phoneExists =
      newPhone.length > 5 &&
      empleados.some(
        (emp) =>
          emp.phone === newPhone && String(emp.id) !== String(originalId),
      );

    document
      .getElementById("edit-emp-id-error")
      .classList.toggle("hidden", !idExists);
    document
      .getElementById("edit-emp-name-error")
      .classList.toggle("hidden", !nameExists);
    document
      .getElementById("edit-emp-phone-error")
      .classList.toggle("hidden", !phoneExists);

    if (idExists || nameExists || phoneExists) return;

    const idx = empleados.findIndex((e) => String(e.id) === String(originalId));
    if (idx > -1) {
      empleados[idx] = { id: newId, name: newName, phone: newPhone };
      saveToLocalStorage();
      renderEmpleados();
      closeEditEmployeeModal();
      showToast("Employee Updated");
    }
  });

  // Search Listener
  employeeSearchInput.addEventListener(
    "input",
    debounce(() => renderEmpleados(), 300),
  );

  function renderEmpleados() {
    employeeListContainer.innerHTML = "";
    if (empleados.length === 0) {
      employeeListContainer.innerHTML =
        '<p style="text-align:center; color:var(--text-muted); font-size:0.8rem;">No employees.</p>';
      return;
    }

    let filtered = empleados;
    const term = employeeSearchInput.value.toLowerCase().trim();

    // Filter if search exists
    if (term) {
      filtered = empleados.filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          String(e.id).toLowerCase().includes(term),
      );
    }

    // Sort alphabetically
    const sorted = [...filtered].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );

    // Show all results (Scrolling is handled by CSS)
    const finalDisplay = sorted;
    if (finalDisplay.length === 0 && term) {
      employeeListContainer.innerHTML =
        '<p style="text-align:center; color:var(--text-muted); font-size:0.8rem;">No matches found.</p>';
      return;
    }

    finalDisplay.forEach((emp) => {
      const item = document.createElement("div");
      item.className = "inventory-list-item";
      item.style.padding = "0.5rem 1rem";

      const infoDiv = document.createElement("div");
      // Use distinct class to avoid inheriting complex grid unwrapping from inventory list
      infoDiv.className = "employee-list-info";
      infoDiv.innerHTML = `<span class="emp-name">${escapeHtml(emp.name)}</span>
                                 <span class="emp-phone">${escapeHtml(emp.phone || "")}</span>`;

      const actionsDiv = document.createElement("div");
      actionsDiv.style.display = "flex";
      actionsDiv.style.gap = "8px";

      const editBtn = document.createElement("button");
      editBtn.className = "btn-icon"; // Reuse generic icon btn style or specific if needed
      editBtn.style.color = "var(--text-muted)";
      editBtn.style.background = "transparent";
      editBtn.style.border = "1px solid var(--border)";
      editBtn.innerHTML = '<i class="ph ph-pencil-simple"></i>';
      editBtn.title = "Edit";
      editBtn.onclick = () => window.abrirEditarEmpleado(emp.id);

      const delBtn = document.createElement("button");
      delBtn.className = "btn-icon-danger";
      delBtn.innerHTML = '<i class="ph ph-trash"></i>';
      delBtn.title = "Delete";
      delBtn.onclick = () => window.eliminarEmpleado(emp.id);

      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(delBtn);

      item.appendChild(infoDiv);
      item.appendChild(actionsDiv);
      employeeListContainer.appendChild(item);
    });
  }

  window.eliminarEmpleado = async (id) => {
    const idx = empleados.findIndex((e) => String(e.id) === String(id));
    if (idx > -1) {
      const empName = empleados[idx].name;
      const hasItems = inventario.some(
        (item) => item.status === "IN USE" && item.asignadoA === empName,
      );

      if (hasItems) {
        showToast(
          `Cannot delete ${empName}. They have items assigned!`,
          "error",
          4000,
        );
        playErrorSound();
        return;
      }

      const confirmed = await showCustomConfirm(`Remove ${empName}?`);
      if (confirmed) {
        empleados.splice(idx, 1);
        saveToLocalStorage();
        renderEmpleados();
      }
    }
  };

  function updateAssigneeDatalist() {
    let dl =
      document.getElementById("employee-datalist") ||
      document.createElement("datalist");
    dl.id = "employee-datalist";
    document.body.appendChild(dl);
    dl.innerHTML = '<option value=" NONE">';
    empleados.forEach((emp) => {
      const opt = document.createElement("option");
      opt.value = emp.name;
      dl.appendChild(opt);
    });
    ["edit-assignedTo"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute("list", "employee-datalist");
    });
  }

  function escapeHtml(text) {
    const d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
  }

  // --- Inventory Manager Module ---
  window.abrirInventoryMgrModal = () => {
    inventoryMgrSearchInput.value = ""; // Reset search on open
    openModalWithHistory(inventoryMgrModal, "inventory-mgr-modal");
    focusWithoutKeyboard(inventoryMgrSearchInput);
    renderInventoryMgrList();
    if (googleSheetsUrl) loadFromGoogleSheets();

    // -- Web Version Check: Disable Camera in Manage Items for Desktop --
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    const isWebVersion = !isMobileDevice;

    if (isWebVersion) {
      if (scanSearchInventoryBtn) scanSearchInventoryBtn.style.display = "none";
    } else {
      if (scanSearchInventoryBtn) scanSearchInventoryBtn.style.display = "flex";
    }
  };

  const closeInventoryMgrModal = () => closeModalWithHistory();
  closeInventoryMgrModalBtn.addEventListener("click", closeInventoryMgrModal);
  const cancelInventoryMgrBtn = document.getElementById(
    "cancel-inventory-mgr-btn",
  );
  if (cancelInventoryMgrBtn)
    cancelInventoryMgrBtn.addEventListener("click", closeInventoryMgrModal);

  inventoryMgrModal.addEventListener("click", (e) => {
    if (e.target === inventoryMgrModal) closeInventoryMgrModal();
  });
  inventoryMgrSearchInput.addEventListener(
    "input",
    debounce(() => renderInventoryMgrList(), 300),
  );

  function renderInventoryMgrList() {
    inventoryMgrListContainer.innerHTML = "";
    const items = inventario;
    if (items.length === 0) {
      inventoryMgrListContainer.innerHTML =
        '<p style="text-align:center; color:var(--text-muted); font-size:0.8rem; margin-top:20px;">No items found.</p>';
      return;
    }

    const term = inventoryMgrSearchInput.value.toLowerCase().trim();
    const filtered = items.filter(
      (i) =>
        i.nombre.toLowerCase().includes(term) ||
        String(i.id).toLowerCase().includes(term) ||
        (i.asignadoA && i.asignadoA.toLowerCase().includes(term)),
    );

    if (filtered.length === 0 && term) {
      inventoryMgrListContainer.innerHTML =
        '<p style="text-align:center; color:var(--text-muted); font-size:0.8rem; margin-top:20px;">No matching items found.</p>';
      return;
    }

    // Automatic Alphabetical Sorting (Matching Employee list feature)
    const sorted = [...filtered].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, undefined, { sensitivity: "base" }),
    );

    // Apply same premium look as Employees
    sorted.forEach((item) => {
      const row = document.createElement("div");
      row.className = "inventory-list-item";
      row.style.padding = "0.5rem 1rem";

      const infoDiv = document.createElement("div");
      infoDiv.className = "employee-list-info"; // Reuse the vertical stack class
      infoDiv.style.flex = "1";
      infoDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; width:100%;">
                    <span class="emp-name">${escapeHtml(item.nombre)}</span>
                    <span class="item-status ${item.status === "AVAILABLE" ? "available" : ""}" style="font-size:0.7rem; margin-left:10px;">${item.status}</span>
                </div>
                <span class="emp-phone" style="font-size:0.75rem; margin-top:2px;">Asset ID: ${escapeHtml(item.id)}</span>
                <span style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">Assigned to: ${escapeHtml(item.asignadoA)}</span>
            `;

      const actionsDiv = document.createElement("div");
      actionsDiv.style.display = "flex";
      actionsDiv.style.gap = "8px";

      const editBtn = document.createElement("button");
      editBtn.className = "btn-icon";
      editBtn.style.color = "var(--text-muted)";
      editBtn.style.background = "transparent";
      editBtn.style.border = "1px solid var(--border)";
      editBtn.innerHTML = '<i class="ph ph-pencil-simple"></i>';
      editBtn.onclick = () => {
        // We reuse the existing item editor modal
        window.abrirModal(item.id);
      };

      const delBtn = document.createElement("button");
      delBtn.className = "btn-icon-danger";
      delBtn.innerHTML = '<i class="ph ph-trash"></i>';
      delBtn.onclick = () => window.eliminarItem(item.id);

      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(delBtn);

      row.appendChild(infoDiv);
      row.appendChild(actionsDiv);
      inventoryMgrListContainer.appendChild(row);
    });
  }

  // --- Stats Modal & Available Accordion ---
  window.abrirStatsModal = () => {
    if (typeof reportsModal !== "undefined" && reportsModal)
      reportsModal.classList.add("hidden");
    openModalWithHistory(statsModal, "stats-modal");
    const total = inventario ? inventario.length : 0;
    const available = inventario
      ? inventario.filter((i) => i.status === "AVAILABLE").length
      : 0;
    const inUse = inventario
      ? inventario.filter(
        (i) => (i.status || "").replace("IN-USED", "IN USE") === "IN USE",
      ).length
      : 0;
    const lost = total - available - inUse;

    document.getElementById("stat-total").textContent = total;
    document.getElementById("stat-available").textContent = available;
    document.getElementById("stat-inuse").textContent = inUse;
    document.getElementById("stat-other").textContent = lost;

    // Reset the accordion state to closed
    const dropdown = document.getElementById("stats-available-dropdown");
    const chevron = document.getElementById("stats-available-chevron");
    if (dropdown) dropdown.classList.add("hidden");
    if (chevron) chevron.style.transform = "rotate(0deg)";

    const inuseDropdown = document.getElementById("stats-inuse-dropdown");
    const inuseChevron = document.getElementById("stats-inuse-chevron");
    if (inuseDropdown) inuseDropdown.classList.add("hidden");
    if (inuseChevron) inuseChevron.style.transform = "rotate(0deg)";

    const lostDropdown = document.getElementById("stats-lost-dropdown");
    const lostChevron = document.getElementById("stats-lost-chevron");
    if (lostDropdown) lostDropdown.classList.add("hidden");
    if (lostChevron) lostChevron.style.transform = "rotate(0deg)";
  };

  // Toggle helper function
  const toggleAccordion = (
    sectionId,
    dropdownId,
    chevronId,
    renderCallback,
  ) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.addEventListener("click", () => {
        const dropdown = document.getElementById(dropdownId);
        const chevron = document.getElementById(chevronId);
        if (dropdown && dropdown.classList.contains("hidden")) {
          if (renderCallback) renderCallback();
          dropdown.classList.remove("hidden");
          if (chevron) {
            chevron.style.transform = "rotate(180deg)";
            chevron.style.transition = "transform 0.3s ease";
          }
        } else if (dropdown) {
          dropdown.classList.add("hidden");
          if (chevron) chevron.style.transform = "rotate(0deg)";
        }
      });
    }
  };

  toggleAccordion(
    "stats-available-section",
    "stats-available-dropdown",
    "stats-available-chevron",
    renderAvailableItemsList,
  );
  toggleAccordion(
    "stats-inuse-section",
    "stats-inuse-dropdown",
    "stats-inuse-chevron",
    renderInuseItemsList,
  );
  toggleAccordion(
    "stats-lost-section",
    "stats-lost-dropdown",
    "stats-lost-chevron",
    renderLostItemsList,
  );

  function renderAvailableItemsList() {
    const list = document.getElementById("available-items-list");
    if (!list) return;
    list.innerHTML = "";
    const available = inventario.filter((i) => i.status === "AVAILABLE");

    if (available.length === 0) {
      list.innerHTML =
        '<div class="empty-state"><i class="ph ph-mask-sad"></i><p>No available items currently.</p></div>';
      return;
    }

    available.forEach((item) => {
      const row = document.createElement("div");
      row.className = "inventory-list-item";
      row.style.padding = "1.25rem";
      row.innerHTML = `
                <div class="employee-list-info" style="flex: 1;">
                    <span class="emp-name" style="font-size: 1.1rem; color: #fff;">${escapeHtml(item.nombre)}</span>
                    <span class="emp-phone" style="margin-top: 4px; opacity: 0.8;">${escapeHtml(item.descripcion)}</span>
                    <div style="margin-top: 8px; font-size: 0.8rem; color: var(--primary); font-weight: 600;">
                        Asset ID: ${escapeHtml(item.id)}
                    </div>
                </div>
                <i class="ph ph-check-circle" style="color: #ffd700; font-size: 1.5rem;"></i>
            `;
      list.appendChild(row);
    });
  }

  function renderInuseItemsList() {
    const list = document.getElementById("inuse-items-list");
    if (!list) return;
    list.innerHTML = "";
    const inUse = inventario.filter(
      (i) => (i.status || "").replace("IN-USED", "IN USE") === "IN USE",
    );

    if (inUse.length === 0) {
      list.innerHTML =
        '<div class="empty-state"><i class="ph ph-mask-sad"></i><p>No items currently in use.</p></div>';
      return;
    }

    inUse.forEach((item) => {
      const row = document.createElement("div");
      row.className = "inventory-list-item";
      row.style.padding = "1.25rem";
      row.innerHTML = `
                <div class="employee-list-info" style="flex: 1;">
                    <span class="emp-name" style="font-size: 1.1rem; color: #fff;">${escapeHtml(item.nombre)}</span>
                    <span class="emp-phone" style="margin-top: 4px; opacity: 0.8;">Assigned to: ${escapeHtml(item.asignadoA)}</span>
                    <div style="margin-top: 8px; font-size: 0.8rem; color: var(--success); font-weight: 600;">
                        Asset ID: ${escapeHtml(item.id)}
                    </div>
                </div>
                <i class="ph ph-user-circle-gear" style="color: var(--success); font-size: 1.5rem;"></i>
            `;
      list.appendChild(row);
    });
  }

  function renderLostItemsList() {
    const list = document.getElementById("lost-items-list");
    if (!list) return;
    list.innerHTML = "";
    const inUseOrAvailable = inventario.filter((i) => {
      let state = (i.status || "").replace("IN-USED", "IN USE");
      return state === "AVAILABLE" || state === "IN USE";
    });

    // The remaining are "lost" / "maintenance"
    const lost = inventario.filter((i) => !inUseOrAvailable.includes(i));

    if (lost.length === 0) {
      list.innerHTML =
        '<div class="empty-state"><i class="ph ph-smiley"></i><p>No lost or maintenance items.</p></div>';
      return;
    }

    lost.forEach((item) => {
      const row = document.createElement("div");
      row.className = "inventory-list-item";
      row.style.padding = "1.25rem";
      row.innerHTML = `
                <div class="employee-list-info" style="flex: 1;">
                    <span class="emp-name" style="font-size: 1.1rem; color: #fff;">${escapeHtml(item.nombre)}</span>
                    <span class="emp-phone" style="margin-top: 4px; opacity: 0.8;">${escapeHtml(item.descripcion)}</span>
                    <div style="margin-top: 8px; font-size: 0.8rem; color: var(--danger); font-weight: 600; display: flex; gap: 8px; align-items: center;">
                        <span>Asset ID: ${escapeHtml(item.id)}</span>
                        ${item.condition ? `<span style="background: rgba(239, 68, 68, 0.2); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; border: 1px solid rgba(239, 68, 68, 0.5);">${escapeHtml(item.condition)}</span>` : ''}
                    </div>
                </div>
                <i class="ph ph-warning-circle" style="color: var(--danger); font-size: 1.5rem;"></i>
            `;
      list.appendChild(row);
    });
  }

  // --- Report Issue Logic ---
  let reportScanner = null;

  window.abrirReportIssueModal = () => {
    reportIssueForm.reset();
    reportItemSearch.value = "";
    selectedReportItemInput.value = "";
    selectedReportCondition = "";
    reportQrReader.style.display = "none";
    startReportScanBtn.innerHTML = '<i class="ph ph-qr-code"></i> Scan';
    if (reportScanner) {
      reportScanner.clear();
      reportScanner = null;
    }

    // Web Version Check: Disable Camera for Desktop
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    const isWebVersion = !isMobileDevice;
    if (isWebVersion) {
      if (startReportScanBtn) startReportScanBtn.style.display = "none";
    } else {
      if (startReportScanBtn) startReportScanBtn.style.display = "inline-flex";
    }

    renderReportItemsList();

    openModalWithHistory(reportIssueModal, "report-issue-modal");
    setTimeout(() => {
      if (typeof focusWithoutKeyboard === "function")
        focusWithoutKeyboard(reportItemSearch);
      else reportItemSearch.focus();
    }, 100);
  };

  function renderReportItemsList() {
    if (!reportItemsList) return;
    reportItemsList.innerHTML = "";
    const term = reportItemSearch.value.toLowerCase().trim();
    let inUse = inventario.filter(
      (i) => (i.status || "").replace("IN-USED", "IN USE") === "IN USE",
    );

    if (term) {
      inUse = inUse.filter(
        (i) =>
          String(i.id).toLowerCase().includes(term) ||
          i.nombre.toLowerCase().includes(term),
      );
    }

    if (inUse.length === 0) {
      reportItemsList.innerHTML = `<div class="empty-state"><i class="ph ph-mask-sad"></i><p>${term ? "No matches found." : "No items currently in use."}</p></div>`;
      return;
    }

    inUse.forEach((item) => {
      const row = document.createElement("div");
      row.className = "inventory-list-item";
      row.style.padding = "0.5rem 1rem";
      row.style.cursor = "pointer";
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "10px";

      const isSelected = selectedReportItemInput.value === String(item.id);
      if (isSelected) {
        row.style.border = "2px solid var(--primary)";
      }

      row.innerHTML = `
                <div class="employee-list-info" style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                        <span class="emp-name" style="font-size: 1rem; color: #fff;">${escapeHtml(item.nombre)}</span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Assigned to: ${escapeHtml(item.asignadoA)}</div>
                    <div style="margin-top: 2px; font-size: 0.75rem; color: var(--primary); font-weight: 500; opacity: 0.7;">
                        ID: ${escapeHtml(item.id)}
                    </div>
                </div>
                <div style="flex-shrink: 0;" onclick="event.stopPropagation()">
                    <select class="report-row-condition" style="padding: 0.5rem; border-radius: 6px; background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--border); appearance: auto;">
                        <option value="" disabled ${!isSelected || !selectedReportCondition ? "selected" : ""}>Condition...</option>
                        <option value="DAMAGED" ${isSelected && selectedReportCondition === "DAMAGED" ? "selected" : ""}>Damaged ⚠️</option>
                        <option value="MISSING" ${isSelected && selectedReportCondition === "MISSING" ? "selected" : ""}>Missing ❓</option>
                    </select>
                </div>
            `;

      const selectEl = row.querySelector(".report-row-condition");
      selectEl.addEventListener("change", (e) => {
        e.stopPropagation();
        selectedReportItemInput.value = item.id;
        selectedReportCondition = e.target.value;
        reportItemSearch.value = "";
        renderReportItemsList(); // Re-render to highlight selection
      });

      row.onclick = () => {
        selectedReportItemInput.value = item.id;
        // optionally we could reset condition or keep it, let's keep it if same item, else blank
        if (!isSelected) selectedReportCondition = "";
        renderReportItemsList(); // Re-render to highlight selection
      };
      reportItemsList.appendChild(row);
    });
  }

  if (reportItemSearch) {
    reportItemSearch.addEventListener("input", renderReportItemsList);
  }

  function stopReportScanner() {
    if (reportScanner) {
      reportScanner
        .stop()
        .then(() => {
          reportQrReader.style.display = "none";
          startReportScanBtn.innerHTML = '<i class="ph ph-qr-code"></i> Scan';
          reportScanner.clear();
          reportScanner = null;
          setTimeout(() => {
            if (typeof focusWithoutKeyboard === "function")
              focusWithoutKeyboard(reportItemSearch);
            else reportItemSearch.focus();
          }, 100);
        })
        .catch((e) => console.error(e));
    }
  }

  const closeReportIssueModal = (e) => {
    if (e) e.stopPropagation();
    stopReportScanner();
    closeModalWithHistory();
  };

  if (closeReportIssueModalBtn)
    closeReportIssueModalBtn.onclick = closeReportIssueModal;
  if (cancelReportBtn) cancelReportBtn.onclick = closeReportIssueModal;
  if (reportIssueModal) {
    reportIssueModal.onclick = (e) => {
      if (e.target === reportIssueModal) closeReportIssueModal();
    };
  }

  startReportScanBtn.addEventListener("click", () => {
    if (reportQrReader.style.display === "none") {
      reportQrReader.style.display = "block";
      startReportScanBtn.innerHTML = '<i class="ph ph-stop"></i> Stop';
      reportScanner = new Html5Qrcode("report-qr-reader");
      const config = {
        ...SCANNER_CONFIG,
        aspectRatio: 1.8,
        qrbox: { width: 280, height: 150 },
      };
      const handleScan = (text) => {
        stopReportScanner();
        giveScanFeedback("report-qr-reader");
        const cleanId = parseQRData(text);
        const item = inventario.find(
          (i) =>
            String(i.id) === String(cleanId) &&
            (i.status || "").replace("IN-USED", "IN USE") === "IN USE",
        );
        if (item) {
          selectedReportItemInput.value = item.id;
          selectedReportCondition = "";
          reportItemSearch.value = "";
          renderReportItemsList();
        } else {
          showToast("Item not found or not IN USE", "error");
          playErrorSound();
        }
      };
      reportScanner
        .start({ facingMode: "environment" }, config, handleScan)
        .catch(() =>
          reportScanner.start({ facingMode: "user" }, config, handleScan),
        );
    } else {
      stopReportScanner();
    }
  });

  reportIssueForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = selectedReportItemInput.value;
    const condition = selectedReportCondition;
    const note = reportNote.value.trim();

    if (!id) {
      showToast("Please select an item to report", "error");
      playErrorSound();
      return;
    }
    if (!condition) {
      showToast("Please select a condition (Damaged / Missing)", "error");
      playErrorSound();
      return;
    }

    const idx = inventario.findIndex((i) => String(i.id) === String(id));
    if (idx === -1) {
      showToast("Asset ID not found in inventory: " + id, "error");
      playErrorSound();
      return;
    }

    const confirmed = await showCustomConfirm(
      `Mark ${inventario[idx].nombre} as ${condition}?`,
    );
    if (!confirmed) return;

    inventario[idx].status =
      condition === "DAMAGED" ? "LOST / MAINTENANCE" : "LOST / MAINTENANCE";
    inventario[idx].condition = condition; // Custom sheet column handled backend
    inventario[idx].incidentNote = note; // Custom sheet column handled backend

    // If it was assigned, could clear assigned employee, but let's keep it to know who used it or just let backend handle it.
    if (inventario[idx].asignadoA !== " NONE" && inventario[idx].asignadoA) {
      inventario[idx].asignadoA += ` (${condition})`;
      // In a more robust system, you might create an incident log instead of appending to asignadoA
    }

    saveToLocalStorage();
    renderInventoryMgrList();
    updateDashboardSummary();
    showToast("Issue reported successfully!");
    closeReportIssueModal();
  });

  // --- Dashboard Initializers ---
  const initDashboard = () => {
    if (dashAvailable) {
      dashAvailable.onclick = () => {
        window.abrirStatsModal();
      };
    }
    if (dashReportIssue) {
      dashReportIssue.onclick = () => {
        window.abrirReportIssueModal();
      };
    }
    if (remindersBtn) {
      remindersBtn.onclick = () => window.abrirRemindersModal();
    }
    updateDashboardSummary();
  };

  window.abrirRemindersModal = () => {
    stopAllScanners();

    const damaged = inventario.filter(i => i.condition === "DAMAGED");

    const overdue = [];
    const fifteenDaysInMs = 15 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    inventario.forEach(i => {
      if (i.status === "IN USE" || i.status === "IN-USED") {
        if (i.fechaAsignacion) {
          const assignDateMs = new Date(i.fechaAsignacion).getTime();
          if (!isNaN(assignDateMs)) {
            if (now - assignDateMs > fifteenDaysInMs) {
              overdue.push(i);
            }
          }
        }
      }
    });

    if (remindersDamagedList) {
      remindersDamagedList.innerHTML = "";
      if (damaged.length === 0) {
        remindersDamagedList.innerHTML = `<div class="empty-state"><i class="ph ph-check-circle" style="color: var(--success); font-size: 2rem; margin-bottom: 0.5rem;"></i><p>No damaged items!</p></div>`;
      } else {
        damaged.forEach(item => {
          const div = document.createElement("div");
          div.className = "inventory-list-item";
          div.innerHTML = `
              <div class="list-item-main">
                  <div class="name-status-wrapper">
                      <span class="item-name" style="color: var(--danger)">${escapeHtml(item.nombre)}</span>
                      <span class="status-badge badge-alerts" style="font-size: 0.7rem; padding: 2px 6px;">${escapeHtml(item.id)}</span>
                  </div>
                  <button type="button" class="btn-text-primary" onclick="window.abrirModal('${item.id}')" style="font-size: 0.8rem; padding: 0.2rem 0.6rem;">
                    Edit
                  </button>
              </div>
              <div class="list-item-info">
                  <span class="list-item-desc">${escapeHtml(item.descripcion || "No description")}</span>
              </div>
          `;
          remindersDamagedList.appendChild(div);
        });
      }
    }

    if (remindersOverdueList) {
      remindersOverdueList.innerHTML = "";
      if (overdue.length === 0) {
        remindersOverdueList.innerHTML = `<div class="empty-state"><i class="ph ph-check-circle" style="color: var(--success); font-size: 2rem; margin-bottom: 0.5rem;"></i><p>No overdue items!</p></div>`;
      } else {
        overdue.forEach(item => {
          const assigneeName = (item.asignadoA || "").replace(" (DAMAGED)", "").replace(" (MISSING)", "").trim();
          const emp = empleados.find(e => e.name === assigneeName);
          const phone = emp ? emp.phone : "";
          const smsBtnHtml = phone ? `<a href="sms:${phone}?body=Reminder:%20Please%20return%20the%20asset%20${encodeURIComponent(item.nombre)}%20(${encodeURIComponent(item.id)})%20assigned%20to%20you.%20Thank%20you!" class="btn-text-primary tooltip-container" style="display:inline-flex; align-items:center; gap:4px; font-size: 0.8rem; padding: 0.2rem 0.6rem; text-decoration: none;"><i class="ph ph-chat-teardrop-text"></i> SMS</a>` : '';

          let formattedDate = item.fechaAsignacion || "";
          if (typeof formattedDate === "string") {
            formattedDate = formattedDate.split(/[\sT,]/)[0];
          }

          const div = document.createElement("div");
          div.className = "inventory-list-item";
          div.innerHTML = `
              <div class="list-item-main">
                  <div class="name-status-wrapper">
                      <span class="item-name" style="color: var(--warning)">${escapeHtml(item.nombre)}</span>
                      <span class="status-badge" style="background: rgba(251, 191, 36, 0.15); color: var(--warning); font-size: 0.7rem; padding: 2px 6px;">Assigned: ${escapeHtml(formattedDate)}</span>
                  </div>
                  <div style="display: flex; gap: 8px;">
                      ${smsBtnHtml}
                  </div>
              </div>
              <div class="list-item-assignee" style="border: none; padding-top: 0; margin-top: 5px;">
                <i class="ph ph-user"></i> ${escapeHtml(assigneeName)}
              </div>
          `;
          remindersOverdueList.appendChild(div);
        });
      }
    }

    if (badgeAlerts) badgeAlerts.textContent = (damaged.length + overdue.length).toString();

    openModalWithHistory(remindersModal, "reminders-modal");
  };

  if (closeRemindersModalBtn) {
    closeRemindersModalBtn.onclick = closeModalWithHistory;
  }

  // --- Assignment Wizard Logic ---
  let wizardScanner = null;

  window.abrirAssignWizard = () => {
    stopAllScanners();
    selectedWizardEmployee = null;
    pendingWizardItems = [];
    wizardEmpSearch.value = "";
    wizardItemInput.value = "";
    wizardStep1.classList.remove("hidden");
    wizardStep2.classList.add("hidden");
    renderWizardEmpResults();
    renderWizardPendingItems();
    wizardTitleContainer.innerHTML = `
            <i class="ph ph-hand-pointing" style="color: var(--primary); font-size: 1.5rem;"></i>
            <h3>Asset Assignment</h3>
        `;

    // -- Web Version Check: Disable Camera in Assignment Wizard for Desktop --
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    const isWebVersion = !isMobileDevice;

    if (isWebVersion) {
      if (wizardScanBadgeBtn) wizardScanBadgeBtn.style.display = "none";
      if (wizardScanItemBtn) wizardScanItemBtn.style.display = "none";
    } else {
      if (wizardScanBadgeBtn) wizardScanBadgeBtn.style.display = "flex";
      if (wizardScanItemBtn) wizardScanItemBtn.style.display = "flex";
    }

    openModalWithHistory(assignWizardModal, "assign-wizard");
    focusWithoutKeyboard(wizardEmpSearch);
  };

  const closeAssignWizard = () => {
    // Si estamos en el paso 2, el botón "X" o cerrar debe llevarnos al paso 1 primero
    if (!wizardStep2.classList.contains("hidden")) {
      goToWizardStep1();
    } else {
      stopWizardScanner();
      wizardEmpSearch.value = "";
      closeModalWithHistory();
    }
  };

  const goToWizardStep1 = (pushHistory = true) => {
    stopWizardScanner();
    wizardStep2.classList.add("hidden");
    wizardStep1.classList.remove("hidden");
    wizardTitleContainer.innerHTML = `
            <i class="ph ph-hand-pointing" style="color: var(--primary); font-size: 1.5rem;"></i>
            <h3>Asset Assignment</h3>
        `;

    // Reset search field and list view
    wizardEmpSearch.value = "";
    renderWizardEmpResults();

    if (pushHistory && history.state?.modal === "assign-wizard-step2") {
      history.back();
    }
    focusWithoutKeyboard(wizardEmpSearch);
  };

  const stopWizardScanner = () => {
    if (wizardScanner) {
      wizardScanner
        .stop()
        .then(() => {
          wizardQrReaderEmp.style.display = "none";
          wizardQrReaderItem.style.display = "none";
          wizardScanBadgeBtn.innerHTML = '<i class="ph ph-qr-code"></i> Scan';
          wizardScanItemBtn.innerHTML = '<i class="ph ph-qr-code"></i> Scan';
          wizardScanner.clear();
          wizardScanner = null;

          // Return focus specifically if we are in Step 1
          if (
            typeof assignWizardModal !== "undefined" &&
            assignWizardModal &&
            !assignWizardModal.classList.contains("hidden") &&
            !wizardStep1.classList.contains("hidden")
          ) {
            setTimeout(() => {
              if (typeof focusWithoutKeyboard === "function") {
                focusWithoutKeyboard(wizardEmpSearch);
              } else {
                wizardEmpSearch.focus();
              }
            }, 100);
          }
        })
        .catch((e) => console.error(e));
    }
  };

  // Step 1: Employee Selection
  function renderWizardEmpResults() {
    const term = wizardEmpSearch.value.toLowerCase().trim();
    wizardEmpResults.innerHTML = "";

    const results = empleados
      .filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          String(e.id).toLowerCase().includes(term),
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    if (results.length === 0) {
      wizardEmpResults.innerHTML =
        '<div style="text-align:center; color:var(--text-muted); padding:1.5rem; font-size:0.85rem;">No employees found.</div>';
      return;
    }

    results.forEach((emp) => {
      const row = document.createElement("div");
      row.className = "inventory-list-item";
      row.style.cursor = "pointer";
      row.innerHTML = `
                <div class="employee-list-info">
                    <span class="emp-name">${escapeHtml(emp.name)}</span>
                    <span class="emp-phone">Badge ID: ${escapeHtml(emp.id)}</span>
                </div>
                <i class="ph ph-caret-right" style="color: var(--primary);"></i>
            `;
      row.onclick = () => selectWizardEmployee(emp);
      wizardEmpResults.appendChild(row);
    });
  }

  const selectWizardEmployee = (emp) => {
    selectedWizardEmployee = emp;
    stopWizardScanner();

    // Push state for Step 2 to enable mobile back button support
    if (history.state?.modal !== "assign-wizard-step2") {
      history.pushState({ modal: "assign-wizard-step2" }, null, "");
    }

    wizardStep1.classList.add("hidden");
    wizardStep2.classList.remove("hidden");

    wizardTitleContainer.innerHTML = `
            <i class="ph ph-user-circle-gear" style="color: var(--success); font-size: 1.25rem;"></i>
            <div style="display: flex; flex-direction: column; line-height: 1.2;">
                <h3 style="font-size: 1rem; margin: 0; color: #fff;">${escapeHtml(emp.name)}</h3>
                <span style="font-size: 0.75rem; color: var(--text-muted);">Badge ID: ${escapeHtml(emp.id)}</span>
            </div>
        `;
    // Enforce no keyboard for item scanning step (with aggressive prevention)
    applyScanReadyAttributes(wizardItemInput);
    wizardItemInput.readOnly = true;
    setTimeout(() => {
      wizardItemInput.focus();
      setTimeout(() => {
        if (wizardItemInput && !wizardScannerBusy)
          wizardItemInput.readOnly = false;
      }, 200);
    }, 50);

    wizardItemInput.value = ""; // Ensure clean start
    renderWizardAvailableItems();
  };

  wizardEmpSearch.addEventListener("input", renderWizardEmpResults);

  wizardScanBadgeBtn.addEventListener("click", () => {
    if (wizardQrReaderEmp.style.display === "none") {
      wizardEmpSearch.value = ""; // Clear input before scan
      wizardQrReaderEmp.style.display = "block";
      wizardScanBadgeBtn.innerHTML = '<i class="ph ph-stop"></i> Stop';
      wizardScanner = new Html5Qrcode("wizard-qr-reader-emp");
      const handleWizardEmpScan = (text) => {
        // 1. Detener el escáner inmediatamente para evitar el "doble escaneo"
        stopWizardScanner();

        // 2. Dar retroalimentación y procesar
        giveScanFeedback("wizard-qr-reader-emp");
        wizardEmpSearch.value = text.trim();
        renderWizardEmpResults();

        const emp = empleados.find((e) => String(e.id) === text.trim());
        if (emp) {
          // Esperar un breve momento para la transición visual
          setTimeout(() => selectWizardEmployee(emp), 300);
        } else {
          showToast("Employee ID not found: " + text, "error");
          playErrorSound();
          wizardEmpSearch.value = "";
          renderWizardEmpResults();
          setTimeout(() => {
            if (typeof focusWithoutKeyboard === "function") {
              focusWithoutKeyboard(wizardEmpSearch);
            } else {
              wizardEmpSearch.focus();
            }
          }, 100);
        }
      };
      const wizardBadgeConfig = {
        ...SCANNER_CONFIG,
        qrbox: { width: 300, height: 150 },
      };
      wizardScanner
        .start(
          { facingMode: "environment" },
          wizardBadgeConfig,
          handleWizardEmpScan,
        )
        .catch(() =>
          wizardScanner.start(
            { facingMode: "user" },
            wizardBadgeConfig,
            handleWizardEmpScan,
          ),
        );
    } else stopWizardScanner();
  });

  // Step 2: Item Assignment
  function renderWizardPendingItems() {
    if (!wizardScannedItemsList) return;
    wizardScannedItemsList.innerHTML = "";

    if (pendingWizardItems.length === 0) {
      wizardScannedItemsList.innerHTML = `
                <div style="
                    text-align: center; 
                    color: #475569; 
                    background: rgba(255, 255, 255, 0.5); 
                    padding: 1.5rem; 
                    border-radius: 12px; 
                    border: 2px dashed rgba(255, 255, 255, 0.4);
                    margin-top: 0.5rem;
                ">
                    <i class="ph ph-shopping-cart" style="font-size: 1.5rem; opacity: 0.5; margin-bottom: 0.5rem; display: block;"></i>
                    <span style="font-size: 0.9rem; font-weight: 500;">No items selected</span>
                </div>`;
      wizardConfirmBtn.disabled = true;
      wizardConfirmBtn.classList.remove("pulse-ready");
      wizardConfirmBtn.textContent = "Assign 0 Items";
    } else {
      pendingWizardItems.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "inventory-list-item";
        row.style.padding = "4px 12px";
        row.innerHTML = `
                    <div class="employee-list-info" style="flex-direction: row; align-items: center; gap: 10px; flex: 1;">
                        <span class="emp-name" style="color: var(--primary); font-size: 0.85rem; margin: 0;">${escapeHtml(item.nombre)}</span>
                        <span class="emp-phone" style="font-size: 0.7rem; opacity: 0.6;">[${escapeHtml(item.id)}]</span>
                    </div>
                    <button class="btn-icon-danger" style="padding: 2px;"><i class="ph ph-x-circle" style="font-size: 1rem;"></i></button>
                `;
        row.querySelector("button").onclick = () => {
          removeWizardItem(item.id);
          wizardItemInput.focus();
        };
        wizardScannedItemsList.appendChild(row);
      });
      wizardConfirmBtn.disabled = false;
      wizardConfirmBtn.classList.add("pulse-ready");
      wizardConfirmBtn.textContent = `Assign ${pendingWizardItems.length} Item${pendingWizardItems.length > 1 ? "s" : ""}`;
    }

    // Refresh the available list to sync checkboxes
    renderWizardAvailableItems();
  }

  function renderWizardAvailableItems() {
    if (!wizardAvailableItemsContainer) return;
    wizardAvailableItemsContainer.innerHTML = "";

    const rawTerm = wizardItemInput.value.toLowerCase().trim();
    // If it's a multi-part scan (ID|Name|Desc), only filter by the first part (ID)
    const term = rawTerm.includes("|") ? rawTerm.split("|")[0].trim() : rawTerm;

    const available = inventario
      .filter(
        (i) =>
          i.status === "AVAILABLE" &&
          (i.nombre.toLowerCase().includes(term) ||
            String(i.id).toLowerCase().includes(term)),
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    if (available.length === 0) {
      wizardAvailableItemsContainer.innerHTML =
        '<div style="text-align:center; color:var(--text-muted); padding:1rem; font-size:0.85rem;">No available items found.</div>';
      return;
    }

    available.forEach((item) => {
      const isSelected = pendingWizardItems.some(
        (p) => String(p.id) === String(item.id),
      );
      const row = document.createElement("div");
      row.className = `inventory-list-item ${isSelected ? "selected-row" : ""}`;
      row.style.padding = "6px 12px";
      row.style.cursor = "pointer";
      row.style.minHeight = "40px";

      row.innerHTML = `
                <div class="employee-list-info" style="flex-direction: row; align-items: center; gap: 10px; flex: 1;">
                    <span class="emp-name" style="font-size: 0.85rem; margin: 0;">${escapeHtml(item.nombre)}</span>
                    <span class="emp-phone" style="font-size: 0.7rem; opacity: 0.6;">ID: ${escapeHtml(item.id)}</span>
                </div>
                <div class="checkbox-container" style="display: flex; align-items: center;">
                    <input type="checkbox" ${isSelected ? "checked" : ""} style="width: 16px; height: 16px; cursor: pointer;">
                </div>
            `;

      row.onclick = (e) => {
        if (e.target.tagName === "INPUT") {
          if (e.target.checked) addWizardItem(item.id, false);
          else {
            removeWizardItem(item.id);
            wizardItemInput.focus();
          }
        } else {
          if (!isSelected) {
            addWizardItem(item.id, false);
          } else {
            removeWizardItem(item.id);
            wizardItemInput.focus();
          }
        }
      };

      wizardAvailableItemsContainer.appendChild(row);
    });
  }

  const removeWizardItem = (id) => {
    const idx = pendingWizardItems.findIndex(
      (i) => String(i.id) === String(id),
    );
    if (idx > -1) {
      pendingWizardItems.splice(idx, 1);
      renderWizardPendingItems();
      playRemoveBeep(); // Feedback auditivo de remoción
    }
  };

  const addWizardItem = (assetId, shouldStopScanner = true) => {
    let id = assetId.trim();
    if (!id) return false;

    // Helper to clear input and maintain focus without keyboard
    const clearAndRefocus = () => {
      if (wizardItemInput) {
        wizardItemInput.value = "";
        applyScanReadyAttributes(wizardItemInput);
        wizardItemInput.readOnly = true;
        wizardItemInput.focus();
        // Increased wait time to 300ms to ensure Chrome doesn't wake up on toast display
        // BUT only unlock if a scanner burst isn't currently in progress
        setTimeout(() => {
          if (wizardItemInput && !wizardScannerBusy) {
            wizardItemInput.readOnly = false;
          }
        }, 300);

        // CRITICAL: Re-render the list since programmatic value change doesn't trigger 'input' event
        renderWizardAvailableItems();
      }
    };

    // Extract ID if using pipe separator format (ID|Name|Desc)
    if (id.includes("|")) {
      const parts = id.split("|");
      if (parts.length > 0) id = parts[0].trim();
    }

    // 1 & 2. Detección y Búsqueda únicamente por Asset ID
    const item = inventario.find((i) => String(i.id) === id);

    // 3. Búsqueda de Inventario (Validar si existe)
    if (!item) {
      clearAndRefocus();
      showToast(`Item not found: ${id}`, "error", 3000);
      playErrorSound();
      return false;
    }

    // 4. Validación de Duplicados (¿Ya está en la lista de esta sesión?)
    if (pendingWizardItems.some((i) => String(i.id) === id)) {
      clearAndRefocus();
      showToast("Item already in list.", "error", 3000);
      playErrorSound();
      return false;
    }

    // 4. Verificación de Estado (¿Está disponible para asignarse?)
    if (item.status !== "AVAILABLE") {
      clearAndRefocus();
      showToast(
        `Cannot assign: Item is currently ${item.status}`,
        "error",
        3000,
      );
      playErrorSound();
      return false;
    }

    // 5. Agregado a la lista Temporal
    pendingWizardItems.unshift(item);

    // 6. Actualización de UI
    renderWizardPendingItems();
    playScanBeep();
    if (shouldStopScanner) stopWizardScanner();

    // Success path: Clear search and show everything again
    clearAndRefocus();
    return true;
  };

  wizardItemInput.addEventListener("input", () => {
    if (wizardScannerBusy) {
      wizardItemInput.value = "";
      return;
    }
    // If it doesn't have a pipe (manual typing), just render results
    if (!wizardItemInput.value.includes("|")) {
      renderWizardAvailableItems();
    }
  });

  wizardItemInput.addEventListener("keydown", (e) => {
    if (wizardScannerBusy) {
      e.preventDefault();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const rawVal = wizardItemInput.value;
      if (!rawVal) return;

      // Extract core ID immediately for the assignment logic
      const cleanId = rawVal.split("|")[0].trim();
      addWizardItem(cleanId);
    }
  });

  wizardScanItemBtn.addEventListener("click", () => {
    if (wizardQrReaderItem.style.display === "none") {
      startWizardScanner();
    } else {
      stopWizardScanner();
      wizardScanItemBtn.innerHTML = '<i class="ph ph-qr-code"></i>';
      wizardItemInput.setAttribute("inputmode", "none");
      wizardItemInput.focus();
    }
  });

  const startWizardScanner = () => {
    wizardQrReaderItem.style.display = "block";
    wizardScanItemBtn.innerHTML = '<i class="ph ph-stop"></i> Stop';
    wizardScanner = new Html5Qrcode("wizard-qr-reader-item");
    const wizardItemConfig = {
      ...SCANNER_CONFIG,
      qrbox: { width: 300, height: 150 },
    };

    wizardScanner
      .start({ facingMode: "environment" }, wizardItemConfig, (text) => {
        // Extract core ID immediately
        const cleanId = parseQRData(text);
        const success = addWizardItem(cleanId, false); // Don't auto-stop inside, we control it here

        if (success) {
          giveScanFeedback("wizard-qr-reader-item");
          // Success: Stop scanner or keep running based on preference?
          // Previously it auto-stopped. Let's stick to original flow but cleaner.
          stopWizardScanner();
          wizardScanItemBtn.innerHTML = '<i class="ph ph-qr-code"></i> Scan';
        } else {
          // FAILURE CASE: Pause -> Wait 3s -> Resume
          stopWizardScanner(); // 1. Stop Camera
          wizardScanItemBtn.innerHTML = '<i class="ph ph-hourglass"></i>';
          wizardScanItemBtn.disabled = true;

          // 2. Wait 3 seconds
          setTimeout(() => {
            wizardScanItemBtn.disabled = false;
            // 3. Restart Camera
            // Check if modal is still open before restarting
            if (!wizardStep2.classList.contains("hidden")) {
              startWizardScanner();
            }
          }, 3000);
        }
      })
      .catch((e) => {
        console.error(e);
        stopWizardScanner();
      });
  };

  // --- Search Scanner Logic ---
  const startSearchScan = (type) => {
    const btn =
      type === "inventory" ? scanSearchInventoryBtn : scanSearchEmployeeBtn;
    const readerDiv =
      type === "inventory"
        ? qrReaderSearchInventoryDiv
        : qrReaderSearchEmployeeDiv;
    const input =
      type === "inventory" ? inventoryMgrSearchInput : employeeSearchInput;

    if (readerDiv.style.display === "none") {
      stopAllScanners();
      readerDiv.style.display = "block";
      if (btn) btn.innerHTML = '<i class="ph ph-stop"></i> Stop';
      input.value = ""; // Clear previous search
      if (type === "inventory") renderInventoryMgrList();
      else renderEmpleados();
      searchScanner = new Html5Qrcode(readerDiv.id);
      const config = { ...SCANNER_CONFIG, qrbox: { width: 280, height: 150 } };

      searchScanner
        .start({ facingMode: "environment" }, config, (text) => {
          let finalSearchText = text.trim();

          // Apply parsing logic ONLY for inventory search
          if (type === "inventory") {
            const { id } = parseAssetData(text);
            if (!String(id).startsWith("FINL")) {
              showToast("Wrong Asset ID", "error");
              playErrorSound();
              stopSearchScanner();
              return;
            }
            finalSearchText = id;
          }

          giveScanFeedback(readerDiv.id);
          input.value = finalSearchText;
          if (type === "inventory") renderInventoryMgrList();
          else renderEmpleados();
          stopSearchScanner();
        })
        .catch((e) => {
          console.error(e);
          stopSearchScanner();
          showToast("Could not start camera");
        });
    } else stopSearchScanner();
  };

  if (scanSearchInventoryBtn)
    scanSearchInventoryBtn.onclick = () => startSearchScan("inventory");
  if (scanSearchEmployeeBtn)
    scanSearchEmployeeBtn.onclick = () => startSearchScan("employee");

  wizardBackBtn.onclick = () => {
    goToWizardStep1();
  };

  wizardConfirmBtn.onclick = () => {
    if (!selectedWizardEmployee || pendingWizardItems.length === 0) return;

    pendingWizardItems.forEach((pendingItem) => {
      const idx = inventario.findIndex(
        (i) => String(i.id) === String(pendingItem.id),
      );
      if (idx > -1) {
        if (inventario[idx].asignadoA && inventario[idx].asignadoA.trim().toUpperCase() !== "NONE" && inventario[idx].asignadoA !== selectedWizardEmployee.name) {
          inventario[idx].lastAssignedTo = inventario[idx].asignadoA;
          inventario[idx].lastDateAssigned = inventario[idx].fechaAsignacion;
          inventario[idx].lastDateReturned = new Date().toLocaleDateString();
        }
        inventario[idx].asignadoA = selectedWizardEmployee.name;
        inventario[idx].status = "IN USE";
        inventario[idx].fechaAsignacion = new Date().toLocaleDateString();
        inventario[idx].fechaRetorno = "";
        inventario[idx].condition = "";
        inventario[idx].incidentNote = "";
      }
    });

    saveToLocalStorage();
    renderInventoryMgrList();
    showToast(
      `Successfully assigned ${pendingWizardItems.length} items to ${selectedWizardEmployee.name}`,
    );

    // Clear pending items for next use
    pendingWizardItems = [];
    renderWizardPendingItems();

    closeAssignWizard();
  };

  closeAssignWizardBtn.onclick = closeAssignWizard;
  assignWizardModal.onclick = (e) => {
    if (e.target === assignWizardModal) closeAssignWizard();
  };

  // --- Return Wizard Logic (Dashboard Tile) ---
  const returnWizardModal = document.getElementById("return-wizard-modal");
  const closeReturnWizardBtn = document.getElementById("close-return-wizard");
  const returnInfoStep = document.getElementById("return-info-step");
  const returnItemStep = document.getElementById("return-item-step");
  const returnEmpSearch = document.getElementById("return-emp-search");
  const returnScanBadgeBtn = document.getElementById("return-scan-badge-btn");
  const returnQrReaderEmp = document.getElementById("return-qr-reader-emp");
  const returnEmpResults = document.getElementById("return-emp-results");
  const returnAssignedItemsList = document.getElementById(
    "return-assigned-items",
  );
  const returnBackBtn = document.getElementById("return-back-btn");
  const returnConfirmBtn = document.getElementById("return-confirm-btn");
  const returnTitleContainer = document.getElementById(
    "return-wizard-title-container",
  );
  const returnItemInput = document.getElementById("return-item-input");
  const returnScanItemBtn = document.getElementById("return-scan-item-btn");
  const returnQrReaderItem = document.getElementById("return-qr-reader-item");

  let selectedReturnEmployee = null;
  let pendingReturnItems = []; // items selected to be returned
  let returnScanner = null;
  let returnScannerBusy = false;

  window.abrirReturnWizard = () => {
    stopAllScanners();
    selectedReturnEmployee = null;
    pendingReturnItems = [];
    returnEmpSearch.value = "";

    // Show Step 1, Hide Step 2
    returnInfoStep.classList.remove("hidden");
    returnItemStep.classList.add("hidden");

    renderReturnEmpResults();

    returnTitleContainer.innerHTML = `
             <i class="ph ph-arrow-u-up-left" style="color: var(--danger); font-size: 1.5rem;"></i>
             <h3>Return Assets</h3>
        `;

    openModalWithHistory(returnWizardModal, "return-wizard");
    focusWithoutKeyboard(returnEmpSearch);

    // -- Web Version Check: Disable Camera in Return Wizard for Desktop --
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    const isWebVersion = !isMobileDevice;

    if (isWebVersion) {
      if (returnScanBadgeBtn) returnScanBadgeBtn.style.display = "none";
      if (returnScanItemBtn) returnScanItemBtn.style.display = "none";
    } else {
      if (returnScanBadgeBtn) {
        returnScanBadgeBtn.style.display = "flex";
        returnScanBadgeBtn.innerHTML = '<i class="ph ph-qr-code"></i> Scan';
      }
      if (returnScanItemBtn) {
        returnScanItemBtn.style.display = "flex";
        returnScanItemBtn.innerHTML = '<i class="ph ph-qr-code"></i> Scan';
      }
    }
  };

  const closeReturnWizard = () => {
    if (!returnItemStep.classList.contains("hidden")) {
      goToReturnStep1();
    } else {
      stopReturnScanner();
      returnEmpSearch.value = "";
      closeModalWithHistory();
    }
  };

  if (closeReturnWizardBtn) closeReturnWizardBtn.onclick = closeReturnWizard;
  if (returnWizardModal)
    returnWizardModal.onclick = (e) => {
      if (e.target === returnWizardModal) closeReturnWizard();
    };

  const stopReturnScanner = () => {
    if (returnScanner) {
      returnScanner
        .stop()
        .then(() => {
          returnQrReaderEmp.style.display = "none";
          returnQrReaderItem.style.display = "none";
          const isMobile =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
              navigator.userAgent,
            );
          returnScanBadgeBtn.innerHTML = '<i class="ph ph-qr-code"></i> Scan';
          returnScanItemBtn.innerHTML = '<i class="ph ph-qr-code"></i> Scan';
          returnScanner.clear();
          returnScanner = null;

          // Return focus specifically if we are in Step 1
          if (
            returnWizardModal &&
            !returnWizardModal.classList.contains("hidden") &&
            !returnInfoStep.classList.contains("hidden")
          ) {
            setTimeout(() => {
              if (typeof focusWithoutKeyboard === "function") {
                focusWithoutKeyboard(returnEmpSearch);
              } else {
                returnEmpSearch.focus();
              }
            }, 100);
          }
        })
        .catch((e) => console.error(e));
    }
  };

  // Step 1: Select Employee
  const renderReturnEmpResults = () => {
    const term = returnEmpSearch.value.toLowerCase().trim();
    returnEmpResults.innerHTML = "";

    // Prioritize employees who have items assigned
    // We can create a quick map of emp -> item count
    const empItemCounts = {};
    inventario.forEach((i) => {
      const rawAssigned = i.asignadoA ? i.asignadoA.trim() : "NONE";
      const assigned = rawAssigned.split("(")[0].trim();

      if (
        assigned !== "NONE" &&
        (i.status === "IN USE" || i.status === "LOST / MAINTENANCE")
      ) {
        if (!empItemCounts[assigned])
          empItemCounts[assigned] = { inUse: 0, lost: 0 };
        if (i.status === "IN USE") empItemCounts[assigned].inUse++;
        else empItemCounts[assigned].lost++;
      }
    });

    // Filter employees
    const results = empleados
      .filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          String(e.id).toLowerCase().includes(term),
      )
      .sort((a, b) => {
        // Sort by has items first, then alphabetical
        const countsA = empItemCounts[a.name] || { inUse: 0, lost: 0 };
        const countsB = empItemCounts[b.name] || { inUse: 0, lost: 0 };
        const hasA = countsA.inUse + countsA.lost > 0;
        const hasB = countsB.inUse + countsB.lost > 0;

        if (hasA && !hasB) return -1;
        if (!hasA && hasB) return 1;
        return a.name.localeCompare(b.name);
      });

    if (results.length === 0) {
      returnEmpResults.innerHTML =
        '<div style="text-align:center; color:var(--text-muted); padding:1.5rem; font-size:0.85rem;">No employees found.</div>';
      return;
    }

    results.forEach((emp) => {
      const counts = empItemCounts[emp.name] || { inUse: 0, lost: 0 };
      const row = document.createElement("div");
      row.className = "inventory-list-item";
      row.style.cursor = "pointer";

      // Visual indicator if they have items
      let badgesHtml = "";
      if (counts.inUse > 0) {
        badgesHtml += `<span class="tile-badge" style="position:static; transform:none; background:var(--warning); color: #000; font-size:0.7rem; padding:2px 8px; margin-right: 5px; font-weight: 800;">${counts.inUse} In Use</span>`;
      }
      if (counts.lost > 0) {
        badgesHtml += `<span class="tile-badge" style="position:static; transform:none; background:var(--danger); font-size:0.7rem; padding:2px 8px; font-weight: 800;">${counts.lost} Issue</span>`;
      }

      row.innerHTML = `
                <div class="employee-list-info">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="emp-name">${escapeHtml(emp.name)}</span>
                        ${badgesHtml}
                    </div>
                    <span class="emp-phone">Badge ID: ${escapeHtml(emp.id)}</span>
                </div>
                <i class="ph ph-caret-right" style="color: var(--primary);"></i>
            `;
      row.onclick = () => selectReturnEmployee(emp);
      returnEmpResults.appendChild(row);
    });
  };

  returnEmpSearch.addEventListener("input", renderReturnEmpResults);

  returnScanBadgeBtn.addEventListener("click", () => {
    if (returnQrReaderEmp.style.display === "none") {
      returnEmpSearch.value = "";
      returnQrReaderEmp.style.display = "block";
      returnScanBadgeBtn.innerHTML = '<i class="ph ph-stop"></i> Stop';
      returnScanner = new Html5Qrcode("return-qr-reader-emp");

      const handleReturnEmpScan = (text) => {
        stopReturnScanner();
        giveScanFeedback("return-qr-reader-emp");
        returnEmpSearch.value = text.trim();
        renderReturnEmpResults();
        const emp = empleados.find((e) => String(e.id) === text.trim());
        if (emp) {
          setTimeout(() => selectReturnEmployee(emp), 300);
        } else {
          showToast("Employee ID not found: " + text, "error");
          playErrorSound();
          returnEmpSearch.value = "";
          renderReturnEmpResults();
          setTimeout(() => {
            if (typeof focusWithoutKeyboard === "function") {
              focusWithoutKeyboard(returnEmpSearch);
            } else {
              returnEmpSearch.focus();
            }
          }, 100);
        }
      };
      const config = { ...SCANNER_CONFIG, qrbox: { width: 300, height: 150 } };
      returnScanner
        .start({ facingMode: "environment" }, config, handleReturnEmpScan)
        .catch(() =>
          returnScanner.start(
            { facingMode: "user" },
            config,
            handleReturnEmpScan,
          ),
        );
    } else stopReturnScanner();
  });

  const selectReturnEmployee = (emp) => {
    selectedReturnEmployee = emp;
    stopReturnScanner();

    // Push state for Step 2
    if (history.state?.modal !== "return-wizard-step2") {
      history.pushState({ modal: "return-wizard-step2" }, null, "");
    }

    returnInfoStep.classList.add("hidden");
    returnItemStep.classList.remove("hidden");

    returnTitleContainer.innerHTML = `
             <i class="ph ph-user-circle-gear" style="color: var(--danger); font-size: 1.25rem;"></i>
             <div style="display: flex; flex-direction: column; line-height: 1.2;">
                <h3 style="font-size: 1rem; margin: 0; color: #fff;">${escapeHtml(emp.name)}</h3>
                 <span style="font-size: 0.75rem; color: var(--text-muted);">Return Assets</span>
            </div>
        `;

    applyScanReadyAttributes(returnItemInput);
    returnItemInput.readOnly = true;
    setTimeout(() => {
      returnItemInput.focus();
      setTimeout(() => {
        if (returnItemInput && !returnScannerBusy)
          returnItemInput.readOnly = false;
      }, 200);
    }, 50);

    returnItemInput.value = "";

    renderReturnableItems();
  };

  const goToReturnStep1 = (pushHistory = true) => {
    stopReturnScanner();
    returnItemStep.classList.add("hidden");
    returnInfoStep.classList.remove("hidden");

    returnTitleContainer.innerHTML = `
             <i class="ph ph-arrow-u-up-left" style="color: var(--danger); font-size: 1.5rem;"></i>
             <h3>Return Assets</h3>
        `;

    if (pushHistory && history.state?.modal === "return-wizard-step2") {
      history.back();
    }
    pendingReturnItems = []; // Reset selection when going back
    returnEmpSearch.value = ""; // Clear employee search field
    returnItemInput.value = ""; // Clear item search field
    renderReturnEmpResults();

    if (returnEmpSearch && typeof focusWithoutKeyboard === "function") {
      focusWithoutKeyboard(returnEmpSearch);
    } else if (returnEmpSearch) {
      returnEmpSearch.focus();
    }
  };

  returnBackBtn.onclick = () => goToReturnStep1();

  // Step 2: Select Items
  const renderReturnableItems = () => {
    if (!returnAssignedItemsList || !selectedReturnEmployee) return;
    returnAssignedItemsList.innerHTML = "";

    const rawTerm = returnItemInput
      ? returnItemInput.value.toLowerCase().trim()
      : "";
    const term = rawTerm.includes("|") ? rawTerm.split("|")[0].trim() : rawTerm;

    // Find items assigned to this employee
    const userItems = inventario.filter((i) => {
      const assigned = (i.asignadoA || "").trim();
      const cleanAssigned = assigned.split("(")[0].trim();
      const targetName = selectedReturnEmployee.name.trim();

      return (
        cleanAssigned === targetName &&
        (i.status === "IN USE" || i.status === "LOST / MAINTENANCE") &&
        (i.nombre.toLowerCase().includes(term) ||
          String(i.id).toLowerCase().includes(term))
      );
    });

    if (userItems.length === 0) {
      returnAssignedItemsList.innerHTML =
        '<div style="text-align:center; color:var(--text-muted); padding:2rem; font-size:0.9rem;">No active assets assigned to this employee.</div>';
      returnConfirmBtn.disabled = true;
      returnConfirmBtn.textContent = "Return 0 Items";
      return;
    }

    userItems.forEach((item) => {
      const isSelected = pendingReturnItems.some(
        (p) => String(p.id) === String(item.id),
      );
      const isLost = item.status === "LOST / MAINTENANCE";

      const row = document.createElement("div");
      row.className = `inventory-list-item ${isSelected ? "selected-row" : ""}`;
      row.style.padding = "10px 12px";
      row.style.cursor = "pointer";

      const statusIcon = isLost
        ? `<span style="color: var(--danger); font-weight: 900; font-size: 1.1rem; margin-right: 8px;" title="Reported as Lost/Maintenance">?</span>`
        : "";

      row.innerHTML = `
                <div class="employee-list-info" style="flex:1;">
                    <div style="display:flex; align-items:center;">
                        ${statusIcon}
                        <span class="emp-name" style="font-size: 0.95rem;">${escapeHtml(item.nombre)}</span>
                    </div>
                     <span class="emp-phone" style="font-size: 0.75rem; opacity: 0.7;">ID: ${escapeHtml(item.id)}</span>
                </div>
                <div class="checkbox-container">
                    <input type="checkbox" ${isSelected ? "checked" : ""} style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--danger);">
                </div>
             `;

      row.onclick = (e) => {
        if (e.target.tagName !== "INPUT") {
          // If clicking row, toggle checkbox
          const cb = row.querySelector("input");
          cb.checked = !cb.checked;
          toggleReturnItemSelection(item, cb.checked);
        } else {
          toggleReturnItemSelection(item, e.target.checked);
        }
        // Re-render to update styling? Or just toggle class.
        // Ideally re-render or just toggle class on row.
        if (isSelected)
          row.classList.remove("selected-row"); // Optimistic update
        else row.classList.add("selected-row");
        // Actually better to just call update logic:
        updateReturnButtonState();
        // Re-render whole list is safer but slower. Let's re-render for simplicity or handle class manual.
        renderReturnableItems();
      };
      returnAssignedItemsList.appendChild(row);
    });
    updateReturnButtonState();
  };

  const toggleReturnItemSelection = (item, isSelected) => {
    if (isSelected) {
      if (!pendingReturnItems.some((p) => String(p.id) === String(item.id))) {
        pendingReturnItems.push(item);
        playScanBeep(); // Feedback al seleccionar
      }
    } else {
      const initialLength = pendingReturnItems.length;
      pendingReturnItems = pendingReturnItems.filter(
        (p) => String(p.id) !== String(item.id),
      );
      if (pendingReturnItems.length < initialLength) {
        playRemoveBeep(); // Feedback al deseleccionar
      }
    }
  };

  const updateReturnButtonState = () => {
    const count = pendingReturnItems.length;
    returnConfirmBtn.textContent = `Return ${count} Item${count !== 1 ? "s" : ""}`;
    returnConfirmBtn.disabled = count === 0;
    if (count > 0) {
      returnConfirmBtn.style.opacity = "1";
      returnConfirmBtn.classList.add("pulse-ready");
    } else {
      returnConfirmBtn.style.opacity = "0.5";
      returnConfirmBtn.classList.remove("pulse-ready");
    }
  };

  const addReturnItem = (assetId, shouldStopScanner = true) => {
    let id = assetId.trim();
    if (!id) return false;

    const clearAndRefocus = () => {
      if (returnItemInput) {
        returnItemInput.value = "";
        applyScanReadyAttributes(returnItemInput);
        returnItemInput.readOnly = true;
        returnItemInput.focus();
        setTimeout(() => {
          if (returnItemInput && !returnScannerBusy) {
            returnItemInput.readOnly = false;
          }
        }, 300);
        renderReturnableItems();
      }
    };

    if (id.includes("|")) {
      const parts = id.split("|");
      if (parts.length > 0) id = parts[0].trim();
    }

    const item = inventario.find((i) => String(i.id) === id);

    if (!item) {
      clearAndRefocus();
      showToast(`Item not found: ${id}`, "error", 3000);
      playErrorSound();
      return false;
    }

    const rawAssigned = (item.asignadoA || "").trim();
    const cleanAssigned = rawAssigned.split("(")[0].trim();
    const targetName = selectedReturnEmployee.name.trim();

    if (
      cleanAssigned !== targetName ||
      (item.status !== "IN USE" && item.status !== "LOST / MAINTENANCE")
    ) {
      clearAndRefocus();
      showToast(
        `Item not assigned to ${selectedReturnEmployee.name}`,
        "error",
        3000,
      );
      playErrorSound();
      return false;
    }

    if (pendingReturnItems.some((i) => String(i.id) === id)) {
      clearAndRefocus();
      showToast("Item already checked for return.", "error", 3000);
      playErrorSound();
      return false;
    }

    pendingReturnItems.unshift(item);
    renderReturnableItems();
    playScanBeep();
    if (shouldStopScanner) stopReturnScanner();

    clearAndRefocus();
    return true;
  };

  returnItemInput.addEventListener("input", () => {
    if (returnScannerBusy) {
      returnItemInput.value = "";
      return;
    }
    if (!returnItemInput.value.includes("|")) {
      renderReturnableItems();
    }
  });

  returnItemInput.addEventListener("keydown", (e) => {
    if (returnScannerBusy) {
      e.preventDefault();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const rawVal = returnItemInput.value;
      if (!rawVal) return;

      const cleanId = rawVal.split("|")[0].trim();
      addReturnItem(cleanId);
    }
  });

  returnScanItemBtn.addEventListener("click", () => {
    if (returnQrReaderItem.style.display === "none") {
      startReturnItemScanner();
    } else {
      stopReturnScanner();
      returnScanItemBtn.innerHTML = '<i class="ph ph-qr-code"></i> Scan';
      returnItemInput.setAttribute("inputmode", "none");
      returnItemInput.focus();
    }
  });

  const startReturnItemScanner = () => {
    returnQrReaderItem.style.display = "block";
    returnScanItemBtn.innerHTML = '<i class="ph ph-stop"></i> Stop';
    returnScanner = new Html5Qrcode("return-qr-reader-item");
    const returnItemConfig = {
      ...SCANNER_CONFIG,
      qrbox: { width: 300, height: 150 },
    };

    returnScanner
      .start({ facingMode: "environment" }, returnItemConfig, (text) => {
        const cleanId = parseQRData(text);
        const success = addReturnItem(cleanId, false);

        if (success) {
          giveScanFeedback("return-qr-reader-item");
          stopReturnScanner();
          returnScanItemBtn.innerHTML = '<i class="ph ph-qr-code"></i> Scan';
        } else {
          stopReturnScanner();
          returnScanItemBtn.innerHTML = '<i class="ph ph-hourglass"></i> Wait';
          returnScanItemBtn.disabled = true;

          setTimeout(() => {
            returnScanItemBtn.disabled = false;
            if (!returnItemStep.classList.contains("hidden")) {
              startReturnItemScanner();
            }
          }, 3000);
        }
      })
      .catch((e) => {
        console.error(e);
        stopReturnScanner();
      });
  };

  returnConfirmBtn.onclick = async () => {
    if (pendingReturnItems.length === 0) return;

    const confirmed = await showCustomConfirm(
      `Confirm return of ${pendingReturnItems.length} items to inventory?`,
    );
    if (confirmed) {
      pendingReturnItems.forEach((pending) => {
        const idx = inventario.findIndex(
          (i) => String(i.id) === String(pending.id),
        );
        if (idx > -1) {
          inventario[idx].lastAssignedTo = inventario[idx].asignadoA;
          inventario[idx].lastDateAssigned = inventario[idx].fechaAsignacion;
          inventario[idx].lastDateReturned = new Date().toLocaleDateString();

          inventario[idx].asignadoA = " NONE";
          inventario[idx].status = "AVAILABLE";
          inventario[idx].fechaRetorno = new Date().toLocaleDateString();
          inventario[idx].fechaAsignacion = "";
          inventario[idx].condition = "";
          inventario[idx].incidentNote = "";
        }
      });

      saveToLocalStorage();
      renderInventoryMgrList();
      showToast(`Successfully returned ${pendingReturnItems.length} items`);

      if (returnEmpSearch) returnEmpSearch.value = ""; // Clear search for next return
      closeReturnWizard();

      // Ensure focus happens after transition
      setTimeout(() => {
        if (returnEmpSearch && typeof focusWithoutKeyboard === "function") {
          focusWithoutKeyboard(returnEmpSearch);
        } else if (returnEmpSearch) {
          returnEmpSearch.focus();
        }
      }, 100);
    }
  };

  // --- New Improved Scanner Handling ---
  const parseAssetData = (text) => {
    let id = text,
      name = "",
      desc = "";
    if (!text) return { id, name, desc };

    try {
      if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
        const obj = JSON.parse(text);
        id = obj.id || obj.ID || id;
        name = obj.name || obj.nombre || "";
        desc = obj.desc || obj.description || "";
      } else {
        let sep = text.includes("|")
          ? "|"
          : text.includes(";")
            ? ";"
            : text.includes(",") && text.split(",").length >= 3
              ? ","
              : "";
        if (sep) {
          const parts = text.split(sep);
          if (parts.length >= 1) id = parts[0].trim();
          if (parts.length >= 2) name = parts[1].trim();
          if (parts.length >= 3) desc = parts.slice(2).join(sep).trim();
        } else {
          id = text.trim();
        }
      }
    } catch (e) {
      console.error("Parse error", e);
      id = text.trim();
    }
    return { id: String(id), name, desc };
  };

  const parseQRData = (text) => {
    return parseAssetData(text).id;
  };

  // 1. Handle "Enter" key on inputs (Scanner usually sends Enter at the end)
  const handleInputEnter = (e, callback) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Parse the current value (Scanner has likely just finished typing)
      const rawValue = e.target.value;
      const parsedValue = parseQRData(rawValue);

      // Update visual input if it changed (so user sees just the ID)
      if (rawValue !== parsedValue) {
        e.target.value = parsedValue;
        // Trigger input event to update any listeners (like validation)
        e.target.dispatchEvent(new Event("input", { bubbles: true }));
      }

      if (callback) callback(parsedValue);
      e.target.blur(); // Close keyboard / confirm input
    }
  };

  // Safely add listeners
  if (
    typeof inventoryMgrSearchInput !== "undefined" &&
    inventoryMgrSearchInput
  ) {
    inventoryMgrSearchInput.addEventListener("keydown", (e) =>
      handleInputEnter(e, () => renderInventoryMgrList()),
    );
  }
  if (typeof employeeSearchInput !== "undefined" && employeeSearchInput) {
    employeeSearchInput.addEventListener("keydown", (e) =>
      handleInputEnter(e, () => renderEmpleados()),
    );
  }

  // Special handling for New Item - Split 3 parts
  const newItemInput = document.getElementById("item-id-scan");
  if (newItemInput) {
    newItemInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const rawValue = e.target.value;
        const { id, name, desc } = parseAssetData(rawValue);

        // Smart logic for New Item
        if (id) {
          newItemInput.value = id;
          const nameInput = document.getElementById("itemName");
          const descInput = document.getElementById("itemDesc");

          // Only autofill if we extracted extra data and fields are empty or overwrite is desired
          if (name && nameInput) nameInput.value = name;
          if (desc && descInput) descInput.value = desc;

          // Trigger input on ID to validate
          newItemInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
        validateIdInput(); // Validate ID availability
        e.target.blur();
      }
    });
  }

  const newEmpInput = document.getElementById("employee-id-scan");
  if (newEmpInput) {
    newEmpInput.addEventListener("keydown", (e) =>
      handleInputEnter(e, () => {
        const event = new Event("input", { bubbles: true });
        newEmpInput.dispatchEvent(event);
      }),
    );
  }
  if (typeof wizardEmpSearch !== "undefined" && wizardEmpSearch) {
    wizardEmpSearch.addEventListener("keydown", (e) =>
      handleInputEnter(e, (val) => {
        const emp = empleados.find(
          (em) =>
            String(em.id) === val.trim() ||
            em.name.toLowerCase() === val.trim().toLowerCase(),
        );
        if (emp) selectWizardEmployee(emp);
      }),
    );
  }

  // 2. Global Fallback Listener (Only if NO input is focused)
  let globalScanBuffer = "";
  let globalScanLastTime = 0;

  // Helper to inject value and trigger events
  const processScannedValue = (inputElement, value) => {
    if (!inputElement) return;
    inputElement.value = value;
    inputElement.dispatchEvent(new Event("input", { bubbles: true }));
    inputElement.dispatchEvent(new Event("change", { bubbles: true }));
    // Optional: Add visual feedback
    inputElement.style.transition = "background-color 0.2s";
    const originalBg = inputElement.style.backgroundColor;
    inputElement.style.backgroundColor = "rgba(var(--primary-rgb), 0.1)";
    setTimeout(() => (inputElement.style.backgroundColor = originalBg), 300);
  };

  document.addEventListener("keydown", (e) => {
    const target = e.target;
    const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

    // If user is typing in an input, let the specific listeners above handle 'Enter'
    // unless it's a global fallback scan (which usually only triggers when NOT in an input)
    // However, some logic below uses !isInput, so we let the flow continue.
    if (isInput && e.key === "Enter") return;

    const now = Date.now();
    // Reset if pause is too long (200ms)
    if (now - globalScanLastTime > 200) {
      globalScanBuffer = "";
    }
    globalScanLastTime = now;

    if (e.key === "Enter") {
      // Process buffer
      const rawText = globalScanBuffer.trim();

      if (rawText.length > 2) {
        // Route to active context
        let handled = false;
        if (!addModal.classList.contains("hidden")) {
          const input = document.getElementById("item-id-scan");
          if (input && (!isInput || target !== input)) {
            // Check for splits here too!
            const { id, name, desc } = parseAssetData(rawText);
            // If we have at least an ID and it looks like it might be from a structured scan or manual pipe entry
            if (id) {
              input.value = id;
              const nameInput = document.getElementById("itemName");
              const descInput = document.getElementById("itemDesc");
              if (name && nameInput) nameInput.value = name;
              if (desc && descInput) descInput.value = desc;

              input.dispatchEvent(new Event("input", { bubbles: true }));
              handled = true;
              validateIdInput();
            }
          }
        } else if (!inventoryMgrModal.classList.contains("hidden")) {
          const text = parseQRData(rawText);
          processScannedValue(inventoryMgrSearchInput, text);
          renderInventoryMgrList();
          handled = true;
        } else if (!addEmployeeModal.classList.contains("hidden")) {
          const input = document.getElementById("employee-id-scan");
          if (input && (!isInput || target !== input)) {
            const text = parseQRData(rawText);
            processScannedValue(input, text);
            handled = true;
          }
        } else if (!employeeModal.classList.contains("hidden")) {
          const text = parseQRData(rawText);
          processScannedValue(employeeSearchInput, text);
          renderEmpleados();
          handled = true;
        } else if (!assignWizardModal.classList.contains("hidden")) {
          const text = parseQRData(rawText);
          if (!wizardStep1.classList.contains("hidden")) {
            processScannedValue(wizardEmpSearch, text);
            const emp = empleados.find(
              (em) =>
                String(em.id) === text ||
                em.name.toLowerCase() === text.toLowerCase(),
            );
            if (emp) selectWizardEmployee(emp);
            handled = true;
          } else if (!wizardStep2.classList.contains("hidden")) {
            addWizardItem(text);
            handled = true;
          }
        }

        if (handled) {
          playScanBeep();
          globalScanBuffer = "";
        }
      }
      globalScanBuffer = "";
    } else {
      // Accumulate if not input
      if (!isInput && e.key.length === 1) {
        globalScanBuffer += e.key;
      }
    }
  });

  // --- Reports Modal Logic ---
  const reportsBtn = document.getElementById("reports-btn");
  const closeReportsModalBtn = document.getElementById("close-reports-modal");
  const closeStatsModalBtn = document.getElementById("close-stats-modal");

  if (reportsBtn) {
    reportsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const moreOptionsMenu = document.getElementById("more-options-menu");
      if (moreOptionsMenu) moreOptionsMenu.classList.add("hidden");
      openModalWithHistory(reportsModal, "reports-modal");
    });
  }
  if (closeReportsModalBtn) {
    closeReportsModalBtn.addEventListener("click", () => {
      closeModalWithHistory();
    });
  }
  if (reportsModal) {
    reportsModal.addEventListener("click", (e) => {
      if (e.target === reportsModal) {
        closeModalWithHistory();
      }
    });
  }

  if (closeStatsModalBtn) {
    closeStatsModalBtn.addEventListener("click", () => {
      closeModalWithHistory();
    });
  }

  // Export CSV Logic
  const reportExportBtn = document.getElementById("report-export-btn");
  if (reportExportBtn) {
    reportExportBtn.addEventListener("click", () => {
      if (!inventario || inventario.length === 0) {
        showToast("No data to export", "error");
        return;
      }
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent +=
        "ID,Name,Description,Assigned To,Status,Assignment Date,Return Date\n";
      inventario.forEach((item) => {
        const row = [
          item.id,
          `"${(item.nombre || "").replace(/"/g, '""')}"`,
          `"${(item.descripcion || "").replace(/"/g, '""')}"`,
          `"${(item.asignadoA || "").replace(/"/g, '""')}"`,
          item.status,
          item.fechaAsignacion,
          item.fechaRetorno,
        ].join(",");
        csvContent += row + "\r\n";
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `Inventory_Export_${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      closeModalWithHistory();
      showToast("Export Successful");
    });
  }



  // Print Logic
  const reportPrintBtn = document.getElementById("report-print-btn");
  if (reportPrintBtn) {
    reportPrintBtn.addEventListener("click", () => {
      closeModalWithHistory();

      const printContainer = document.createElement("div");
      printContainer.id = "print-container";
      const dateStr = new Date().toLocaleDateString();

      let tableHtml = `
                <div class="print-header">
                    <h2>Inventory Report</h2>
                    <p>Generated on ${dateStr}</p>
                </div>
                <table class="print-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Assigned To</th>
                            <th>Date Assigned</th>
                            <th>Date Returned</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
      if (inventario) {
        inventario.forEach((item) => {
          const formatDt = (d) => (d && typeof d === "string" ? d.split(/[\sT]/)[0] : d || "");
          tableHtml += `
                        <tr>
                            <td>${item.id}</td>
                            <td>${item.nombre}</td>
                            <td>${item.status}</td>
                            <td>${item.asignadoA}</td>
                            <td>${formatDt(item.fechaAsignacion)}</td>
                            <td>${formatDt(item.fechaRetorno)}</td>
                        </tr>
                    `;
        });
      }
      tableHtml += `</tbody></table>`;
      printContainer.innerHTML = tableHtml;
      document.body.appendChild(printContainer);

      window.print();

      setTimeout(() => {
        const pc = document.getElementById("print-container");
        if (pc) pc.remove();
      }, 1000);
    });
  }

  // Employee List Report Logic
  const reportEmpListBtn = document.getElementById("report-emp-list-btn");
  const reportEmpListModal = document.getElementById("report-emp-list-modal");
  const closeReportEmpListModalBtn = document.getElementById("close-report-emp-list-modal");
  const reportEmpGridContainer = document.getElementById("report-emp-grid-container");
  const reportEmpExportBtn = document.getElementById("report-emp-export-btn");
  const reportEmpPrintBtn = document.getElementById("report-emp-print-btn");

  const renderEmpReportList = () => {
    if (!reportEmpGridContainer) return;
    reportEmpGridContainer.innerHTML = "";
    if (!empleados || empleados.length === 0) {
      reportEmpGridContainer.innerHTML =
        '<div style="text-align:center; color:var(--text-muted); padding:1.5rem; width:100%; font-size:0.85rem;">No employees found.</div>';
      return;
    }

    // Compute items assigned to employees for badges
    const empItemCounts = {};
    if (inventario) {
      inventario.forEach(item => {
        if (item.status === "IN USE" || item.status === "LOST / MAINTENANCE") {
          const assigned = (item.asignadoA || "").trim();
          const cleanAssigned = assigned.split("(")[0].trim();
          if (cleanAssigned && cleanAssigned !== "NONE") {
            if (!empItemCounts[cleanAssigned]) {
              empItemCounts[cleanAssigned] = { inUse: 0, lost: 0 };
            }
            if (item.status === "IN USE") {
              empItemCounts[cleanAssigned].inUse++;
            } else if (item.status === "LOST / MAINTENANCE") {
              empItemCounts[cleanAssigned].lost++;
            }
          }
        }
      });
    }

    const sortedEmp = [...empleados].sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    sortedEmp.forEach((emp) => {
      const counts = empItemCounts[emp.name] || { inUse: 0, lost: 0 };
      const row = document.createElement("div");
      row.className = "inventory-list-item";
      row.style.cursor = "default";

      let badgesHtml = "";
      if (counts.inUse > 0) {
        badgesHtml += `<span class="tile-badge" style="position:static; transform:none; background:var(--warning); color: #000; font-size:0.7rem; padding:2px 8px; margin-right: 5px; font-weight: 800;">${counts.inUse} In Use</span>`;
      }
      if (counts.lost > 0) {
        badgesHtml += `<span class="tile-badge" style="position:static; transform:none; background:var(--danger); font-size:0.7rem; padding:2px 8px; font-weight: 800;">${counts.lost} Issue</span>`;
      }

      row.innerHTML = `
        <div class="employee-list-info">
            <div style="display:flex; align-items:center; gap:10px;">
                <span class="emp-name">${escapeHtml(emp.name)}</span>
                ${badgesHtml}
            </div>
            <span class="emp-phone">Badge ID: ${escapeHtml(String(emp.id))}${emp.phone ? ` • ${escapeHtml(emp.phone)}` : ""}</span>
        </div>
      `;
      reportEmpGridContainer.appendChild(row);
    });
  };

  if (reportEmpListBtn && reportEmpListModal) {
    reportEmpListBtn.addEventListener("click", () => {
      if (typeof reportsModal !== "undefined" && reportsModal) {
        reportsModal.classList.add("hidden");
      }
      renderEmpReportList();
      openModalWithHistory(reportEmpListModal, "report-emp-list-modal");
    });
  }

  if (closeReportEmpListModalBtn) {
    closeReportEmpListModalBtn.addEventListener("click", () => {
      closeModalWithHistory();
    });
  }

  // Export CSV for Employee List
  if (reportEmpExportBtn) {
    reportEmpExportBtn.addEventListener("click", () => {
      if (!empleados || empleados.length === 0) {
        showToast("No employee data to export", "error");
        return;
      }
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Badge ID,Name,Phone\n";
      const sortedEmp = [...empleados].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      sortedEmp.forEach((emp) => {
        const row = [
          emp.id,
          `"${(emp.name || "").replace(/"/g, '""')}"`,
          `"${(emp.phone || "").replace(/"/g, '""')}"`
        ].join(",");
        csvContent += row + "\r\n";
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Employees_List_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Export Successful");
    });
  }

  // Print for Employee List
  if (reportEmpPrintBtn) {
    reportEmpPrintBtn.addEventListener("click", () => {
      const printContainer = document.createElement("div");
      printContainer.id = "print-container";
      const dateStr = new Date().toLocaleDateString();

      let tableHtml = `
           <div class="print-header">
               <h2>Employee List</h2>
               <p>Generated on ${dateStr}</p>
           </div>
           <table class="print-table">
               <thead>
                   <tr>
                       <th>Badge ID</th>
                       <th>Name</th>
                       <th>Phone</th>
                   </tr>
               </thead>
               <tbody>
       `;
      if (empleados) {
        const sortedEmp = [...empleados].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        sortedEmp.forEach((emp) => {
          tableHtml += `
                 <tr>
                     <td>${escapeHtml(String(emp.id))}</td>
                     <td>${escapeHtml(emp.name)}</td>
                     <td>${escapeHtml(emp.phone || "N/A")}</td>
                 </tr>
             `;
        });
      }
      tableHtml += '</tbody></table>';
      printContainer.innerHTML = tableHtml;
      document.body.appendChild(printContainer);

      window.print();

      setTimeout(() => {
        const pc = document.getElementById("print-container");
        if (pc) pc.remove();
      }, 1000);
    });
  }

  // Movements Report Logic
  const reportMovementsBtn = document.getElementById("report-movements-btn");
  const reportMovementsModal = document.getElementById("report-movements-modal");
  const closeReportMovementsModalBtn = document.getElementById("close-report-movements-modal");
  const reportMovementsGridContainer = document.getElementById("report-movements-grid-container");
  const reportMovementsExportBtn = document.getElementById("report-movements-export-btn");
  const reportMovementsPrintBtn = document.getElementById("report-movements-print-btn");
  const movementsSearchInput = document.getElementById("movements-search-input");

  const formatDateOnly = (dateStr) => {
    if (!dateStr || dateStr === "N/A") return "N/A";
    if (typeof dateStr === "string") return dateStr.split(/[\sT]/)[0];
    return dateStr;
  };

  const buildMovementsData = () => {
    return inventario.filter(item => {
      // Show if it has been assigned at least once or currently assigned
      return item.lastAssignedTo || (item.asignadoA && item.asignadoA !== " NONE" && item.asignadoA !== "NONE");
    });
  };

  const renderMovementsReportList = () => {
    if (!reportMovementsGridContainer) return;
    reportMovementsGridContainer.innerHTML = "";

    let movData = buildMovementsData();

    if (!movData || movData.length === 0) {
      reportMovementsGridContainer.innerHTML =
        '<div style="text-align:center; color:var(--text-muted); padding:1.5rem; width:100%; font-size:0.85rem;">No movements found.</div>';
      return;
    }

    const term = (movementsSearchInput ? movementsSearchInput.value.toLowerCase().trim() : "");
    if (term) {
      movData = movData.filter(item => {
        return String(item.id).toLowerCase().includes(term) ||
          (item.nombre || "").toLowerCase().includes(term) ||
          (item.lastAssignedTo || item.asignadoA || "").toLowerCase().includes(term);
      });
    }

    if (movData.length === 0) {
      reportMovementsGridContainer.innerHTML =
        '<div style="text-align:center; color:var(--text-muted); padding:1.5rem; width:100%; font-size:0.85rem;">No matches found.</div>';
      return;
    }

    // Sort by Name
    movData.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

    movData.forEach((item) => {
      // Note: If the item is currently in use, show current assignment as movement, else last movement
      const isCurrentlyAssigned = item.status === "IN USE" || item.status === "LOST / MAINTENANCE";
      const assignedTo = isCurrentlyAssigned ? item.asignadoA : (item.lastAssignedTo || item.asignadoA || "N/A");
      const previousAssignedTo = item.lastAssignedTo || "N/A";
      const dateAssigned = formatDateOnly(isCurrentlyAssigned ? item.fechaAsignacion : (item.lastDateAssigned || item.fechaAsignacion || "N/A"));
      const dateReturned = formatDateOnly(isCurrentlyAssigned ? "" : (item.lastDateReturned || item.fechaRetorno || "N/A"));

      const row = document.createElement("div");
      row.className = "inventory-list-item";
      row.style.cursor = "default";
      row.style.display = "flex";
      row.style.flexDirection = "column";
      row.style.padding = "1rem";

      row.innerHTML = `
        <div class="employee-list-info" style="width: 100%;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 5px;">
                <span class="emp-name" style="color: var(--primary); font-size: 1.1rem;">${escapeHtml(item.nombre)} <span style="font-size: 0.8rem; color: var(--text-muted);">#${escapeHtml(String(item.id))}</span></span>
                <span class="tile-badge" style="position:static; transform:none; background:rgba(34, 197, 94, 0.2); color: var(--success); font-size:0.75rem; padding: 2px 8px; font-weight: bold;">Movement</span>
            </div>
            <div style="font-size: 0.85rem; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 5px;">
                <div><span style="color:var(--text-muted);">Last checked out by:</span><br/>${escapeHtml(assignedTo.replace(" (DAMAGED)", "").replace(" (MISSING)", ""))}</div>
                <div><span style="color:var(--text-muted);">Previous checked out by:</span><br/>${escapeHtml(previousAssignedTo.replace(" (DAMAGED)", "").replace(" (MISSING)", ""))}</div>
                <div><span style="color:var(--text-muted);">Current status of the Asset:</span><br/>${escapeHtml(item.status)}</div>
                <div><span style="color:var(--text-muted);">Date Assigned:</span><br/>${escapeHtml(dateAssigned)}</div>
                <div><span style="color:var(--text-muted);">Date Returned:</span><br/>${escapeHtml(dateReturned)}</div>
            </div>
        </div>
      `;
      reportMovementsGridContainer.appendChild(row);
    });
  };

  if (reportMovementsBtn && reportMovementsModal) {
    reportMovementsBtn.addEventListener("click", () => {
      if (typeof reportsModal !== "undefined" && reportsModal) {
        reportsModal.classList.add("hidden");
      }
      if (movementsSearchInput) movementsSearchInput.value = "";
      renderMovementsReportList();
      openModalWithHistory(reportMovementsModal, "report-movements-modal");
    });
  }

  if (closeReportMovementsModalBtn) {
    closeReportMovementsModalBtn.addEventListener("click", () => {
      closeModalWithHistory();
    });
  }

  if (movementsSearchInput) {
    movementsSearchInput.addEventListener("input", renderMovementsReportList);
  }

  if (reportMovementsExportBtn) {
    reportMovementsExportBtn.addEventListener("click", () => {
      const movData = buildMovementsData();
      if (!movData || movData.length === 0) {
        showToast("No movements data to export", "error");
        return;
      }
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Asset ID,Name,Last checked out by,Previous checked out by,Date Assigned,Date Returned\n";
      const sortedInv = [...movData].sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
      sortedInv.forEach((item) => {
        const isCurrentlyAssigned = item.status === "IN USE" || item.status === "LOST / MAINTENANCE";
        const assignedTo = isCurrentlyAssigned ? item.asignadoA : (item.lastAssignedTo || item.asignadoA || "N/A");
        const previousAssignedTo = item.lastAssignedTo || "N/A";
        const dateAssigned = formatDateOnly(isCurrentlyAssigned ? item.fechaAsignacion : (item.lastDateAssigned || item.fechaAsignacion || "N/A"));
        const dateReturned = formatDateOnly(isCurrentlyAssigned ? "" : (item.lastDateReturned || item.fechaRetorno || "N/A"));

        const row = [
          item.id,
          `"${(item.nombre || "").replace(/"/g, '""')}"`,
          `"${(assignedTo || "").replace(" (DAMAGED)", "").replace(" (MISSING)", "").replace(/"/g, '""')}"`,
          `"${(previousAssignedTo || "").replace(" (DAMAGED)", "").replace(" (MISSING)", "").replace(/"/g, '""')}"`,
          `"${(dateAssigned || "").replace(/"/g, '""')}"`,
          `"${(dateReturned || "").replace(/"/g, '""')}"`
        ].join(",");
        csvContent += row + "\r\n";
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Movements_Report_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Export Successful");
    });
  }

  if (reportMovementsPrintBtn) {
    reportMovementsPrintBtn.addEventListener("click", () => {
      const movData = buildMovementsData();
      if (!movData || movData.length === 0) {
        showToast("No movements data to export", "error");
        return;
      }
      const printContainer = document.createElement("div");
      printContainer.id = "print-container";
      const dateStr = new Date().toLocaleDateString();

      let tableHtml = `
           <div class="print-header">
               <h2>Movements Report</h2>
               <p>Generated on ${dateStr}</p>
           </div>
           <table class="print-table">
               <thead>
                   <tr>
                       <th>Asset ID</th>
                       <th>Name</th>
                       <th>Last checked out by</th>
                       <th>Previous checked out by</th>
                       <th>Date Assigned</th>
                       <th>Date Returned</th>
                   </tr>
               </thead>
               <tbody>
       `;
      const sortedInv = [...movData].sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
      sortedInv.forEach((item) => {
        const isCurrentlyAssigned = item.status === "IN USE" || item.status === "LOST / MAINTENANCE";
        const assignedTo = isCurrentlyAssigned ? item.asignadoA : (item.lastAssignedTo || item.asignadoA || "N/A");
        const previousAssignedTo = item.lastAssignedTo || "N/A";
        const dateAssigned = formatDateOnly(isCurrentlyAssigned ? item.fechaAsignacion : (item.lastDateAssigned || item.fechaAsignacion || "N/A"));
        const dateReturned = formatDateOnly(isCurrentlyAssigned ? "" : (item.lastDateReturned || item.fechaRetorno || "N/A"));

        tableHtml += `
               <tr>
                   <td>${escapeHtml(String(item.id))}</td>
                   <td>${escapeHtml(item.nombre)}</td>
                   <td>${escapeHtml(assignedTo.replace(" (DAMAGED)", "").replace(" (MISSING)", ""))}</td>
                   <td>${escapeHtml(previousAssignedTo.replace(" (DAMAGED)", "").replace(" (MISSING)", ""))}</td>
                   <td>${escapeHtml(dateAssigned)}</td>
                   <td>${escapeHtml(dateReturned)}</td>
               </tr>
           `;
      });
      tableHtml += '</tbody></table>';
      printContainer.innerHTML = tableHtml;
      document.body.appendChild(printContainer);

      window.print();

      setTimeout(() => {
        const pc = document.getElementById("print-container");
        if (pc) pc.remove();
      }, 1000);
    });
  }


  // Accountability & Risk Report Logic
  const reportRiskBtn = document.getElementById("report-risk-btn");
  const reportRiskModal = document.getElementById("report-risk-modal");
  const closeReportRiskModalBtn = document.getElementById("close-report-risk-modal");
  const riskListContainer = document.getElementById("risk-list");
  const riskSearchInput = document.getElementById("risk-search-input");
  const riskHighestIncidents = document.getElementById("risk-highest-incidents");
  const riskTopHolder = document.getElementById("risk-top-holder");
  const riskPrintBtn = document.getElementById("risk-print-btn");
  const riskExportBtn = document.getElementById("risk-export-btn");
  const riskBackBtn = document.getElementById("risk-back-btn");

  let riskDataCache = [];

  const renderRiskReport = (searchTerm = "") => {
    if (!riskListContainer) return;
    riskListContainer.innerHTML = "";

    // Calculate risk metrics
    const empDataMap = {};
    if (empleados) {
      empleados.forEach(emp => {
        empDataMap[emp.name] = { emp, inUse: 0, lost: 0, damaged: 0, missing: 0, totalAssigned: 0, items: [] };
      });
    }

    if (inventario) {
      inventario.forEach(item => {
        if (item.status === "IN USE" || item.status === "LOST / MAINTENANCE") {
          const assigned = (item.asignadoA || "").trim();
          const cleanAssigned = assigned.split("(")[0].trim();
          if (cleanAssigned && cleanAssigned !== "NONE") {
            if (!empDataMap[cleanAssigned]) {
              empDataMap[cleanAssigned] = { emp: { name: cleanAssigned, id: "N/A" }, inUse: 0, lost: 0, damaged: 0, missing: 0, totalAssigned: 0, items: [] };
            }
            empDataMap[cleanAssigned].totalAssigned++;
            empDataMap[cleanAssigned].items.push(item);
            if (item.status === "IN USE") {
              empDataMap[cleanAssigned].inUse++;
            } else if (item.status === "LOST / MAINTENANCE") {
              empDataMap[cleanAssigned].lost++;
              if (item.condition === "DAMAGED") {
                empDataMap[cleanAssigned].damaged++;
              } else if (item.condition === "MISSING") {
                empDataMap[cleanAssigned].missing++;
              }
            }
          }
        }
      });
    }

    riskDataCache = Object.values(empDataMap)
      .filter(data => data.totalAssigned > 0)
      .sort((a, b) => b.totalAssigned - a.totalAssigned);

    let highestIncidentsAmt = 0;
    let highestIncidentsName = "-";
    let topHolderAmt = 0;
    let topHolderName = "-";

    riskDataCache.forEach(data => {
      if (data.lost > highestIncidentsAmt) {
        highestIncidentsAmt = data.lost;
        highestIncidentsName = data.emp.name;
      }
      if (data.totalAssigned > topHolderAmt) {
        topHolderAmt = data.totalAssigned;
        topHolderName = data.emp.name;
      }
    });

    if (riskHighestIncidents) riskHighestIncidents.textContent = highestIncidentsAmt > 0 ? `${highestIncidentsName} (${highestIncidentsAmt})` : "None";
    if (riskTopHolder) riskTopHolder.textContent = topHolderAmt > 0 ? `${topHolderName} (${topHolderAmt})` : "None";

    const filtered = riskDataCache.filter(d =>
      d.emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(d.emp.id).toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filtered.length === 0) {
      riskListContainer.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:1.5rem; width:100%; font-size:0.85rem;">No assets currently assigned.</div>';
      return;
    }

    filtered.forEach(data => {
      const row = document.createElement("div");
      row.className = "inventory-list-item";
      row.style.cursor = "default";
      row.style.flexDirection = "column";
      row.style.alignItems = "stretch";

      let statusRowHtml = `
         <div style="display:flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; width: 100%;">
             <span class="tile-badge" style="position:static; transform:none; background:var(--warning); color: #000; font-size:0.75rem; padding:3px 8px; font-weight: 800; border-radius: 6px;">${data.inUse} Active</span>
             ${data.damaged > 0 ? `<span class="tile-badge" style="position:static; transform:none; background:var(--danger); color: white; font-size:0.75rem; padding:3px 8px; font-weight: 800; border-radius: 6px;">${data.damaged} Damaged</span>` : ''}
             ${data.missing > 0 ? `<span class="tile-badge" style="position:static; transform:none; background:#8b0000; color: white; font-size:0.75rem; padding:3px 8px; font-weight: 800; border-radius: 6px;">${data.missing} Missing</span>` : ''}
         </div>
      `;

      let notesToggleHtml = "";
      let issuesHtml = "";
      const issueItems = data.items.filter(item => item.status === "LOST / MAINTENANCE");
      if (issueItems.length > 0) {
        const toggleId = "risk-notes-" + Math.random().toString(36).substring(2, 9);
        notesToggleHtml = `
          <div style="display: flex; justify-content: center; margin-top: 12px; width: 100%; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 8px;">
            <button onclick="document.getElementById('${toggleId}').classList.toggle('hidden')" style="background: rgba(255,255,255,0.08); border: 1px solid var(--border); border-radius: 50%; width: 34px; height: 34px; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;" title="Show Incident Notes">
              <i class="ph ph-notebook" style="font-size: 1.1rem;"></i>
            </button>
          </div>
        `;

        issuesHtml = `<div id="${toggleId}" class="hidden" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); width: 100%;">`;
        issueItems.forEach(item => {
          const cond = item.condition || "UNKNOWN";
          const note = item.incidentNote || "No note provided.";
          issuesHtml += `<div style="font-size: 0.8rem; margin-bottom: 6px; padding-left: 8px; border-left: 2px solid ${cond === 'MISSING' ? '#8b0000' : 'var(--danger)'};">
            <div style="font-weight: 600; color: #fff;">[${escapeHtml(String(item.id))}] ${escapeHtml(item.nombre)} <span style="opacity:0.7; font-size: 0.7rem;">(${escapeHtml(cond)})</span></div>
            <div style="color: var(--text-muted); font-size: 0.75rem; font-style: italic; margin-top: 2px;">"${escapeHtml(note)}"</div>
          </div>`;
        });
        issuesHtml += `</div>`;
      }

      row.innerHTML = `
        <div style="display:flex; justify-content: space-between; align-items:center; width: 100%;">
            <div class="employee-list-info" style="flex:1;">
                <span class="emp-name" style="font-size: 1rem;">${escapeHtml(data.emp.name)}</span>
                <span class="emp-phone">ID: ${escapeHtml(String(data.emp.id))}</span>
            </div>
            <div style="font-size: 1.2rem; font-weight: 800; color: white;">${data.totalAssigned}</div>
        </div>
        ${statusRowHtml}
        ${notesToggleHtml}
        ${issuesHtml}
      `;
      riskListContainer.appendChild(row);
    });
  };

  if (reportRiskBtn && reportRiskModal) {
    reportRiskBtn.addEventListener("click", () => {
      if (typeof reportsModal !== "undefined" && reportsModal) {
        reportsModal.classList.add("hidden");
      }
      if (riskSearchInput) riskSearchInput.value = "";
      renderRiskReport();
      openModalWithHistory(reportRiskModal, "report-risk-modal");
    });
  }

  if (closeReportRiskModalBtn) {
    closeReportRiskModalBtn.addEventListener("click", () => {
      closeModalWithHistory();
    });
  }

  if (riskBackBtn) {
    riskBackBtn.addEventListener("click", () => {
      closeModalWithHistory();
    });
  }

  if (riskSearchInput) {
    riskSearchInput.addEventListener("input", (e) => {
      renderRiskReport(e.target.value);
    });
  }

  if (riskExportBtn) {
    riskExportBtn.addEventListener("click", () => {
      if (riskDataCache.length === 0) {
        showToast("No data to export", "error");
        return;
      }
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Employee Name,Badge ID,Total Assigned,Active Devices,Damaged,Missing,Incident Notes\n";
      riskDataCache.forEach(d => {
        const notes = d.items.filter(i => i.status === "LOST / MAINTENANCE").map(i => `[${i.id}] ${i.nombre} (${i.condition || "UNKNOWN"}): ${i.incidentNote || "None"}`).join(" | ");
        const row = [
          `"${(d.emp.name || "").replace(/"/g, '""')}"`,
          d.emp.id,
          d.totalAssigned,
          d.inUse,
          d.damaged,
          d.missing,
          `"${notes.replace(/"/g, '""')}"`
        ].join(",");
        csvContent += row + "\r\n";
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Risk_Report_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Export Successful");
    });
  }

  if (riskPrintBtn) {
    riskPrintBtn.addEventListener("click", () => {
      const printContainer = document.createElement("div");
      printContainer.id = "print-container";
      const dateStr = new Date().toLocaleDateString();

      let tableHtml = `
               <div class="print-header">
                   <h2>Accountability & Risk Report</h2>
                   <p>Generated on ${dateStr}</p>
               </div>
               <table class="print-table">
                   <thead>
                       <tr>
                           <th>Employee Name</th>
                           <th>ID</th>
                           <th>Total Assigned</th>
                           <th>Active</th>
                           <th>Damaged</th>
                           <th>Missing</th>
                           <th>Incident Notes</th>
                       </tr>
                   </thead>
                   <tbody>
           `;
      riskDataCache.forEach((d) => {
        const notesHtml = d.items.filter(i => i.status === "LOST / MAINTENANCE")
          .map(i => `<b>[${escapeHtml(String(i.id))}] ${escapeHtml(i.nombre)}</b> (${escapeHtml(i.condition || "UNKNOWN")}): <i>${escapeHtml(i.incidentNote || "None")}</i>`)
          .join("<br/>");
        tableHtml += `
                     <tr>
                         <td>${escapeHtml(d.emp.name)}</td>
                         <td>${escapeHtml(String(d.emp.id))}</td>
                         <td>${d.totalAssigned}</td>
                         <td>${d.inUse}</td>
                         <td>${d.damaged}</td>
                         <td>${d.missing}</td>
                         <td style="font-size: 0.8rem;">${notesHtml}</td>
                     </tr>
                 `;
      });
      tableHtml += '</tbody></table>';
      printContainer.innerHTML = tableHtml;
      document.body.appendChild(printContainer);

      window.print();

      setTimeout(() => {
        const pc = document.getElementById("print-container");
        if (pc) pc.remove();
      }, 1000);
    });
  }

  initDashboard();
});
