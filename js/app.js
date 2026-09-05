(() => {
  "use strict";

  const SQRT3 = Math.sqrt(3);

  function fmt(n, decimals = 2) {
    if (n === null || n === undefined || Number.isNaN(n) || !Number.isFinite(n)) return "—";
    const rounded = Number(n.toFixed(decimals));
    return rounded.toLocaleString("fr-CA", { maximumFractionDigits: decimals });
  }

  function num(el) {
    const v = parseFloat(el.value);
    return Number.isFinite(v) ? v : null;
  }

  // ---------- Tabs ----------
  const tabButtons = document.querySelectorAll("#tabs button");
  const panels = document.querySelectorAll(".panel");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
    });
  });

  // ---------- Panel 1: Ohm's law / power wheel ----------
  (function ohmWheel() {
    const fields = ["V", "I", "R", "P"];
    const inputs = {};
    fields.forEach((f) => (inputs[f] = document.getElementById("ohm-" + f)));
    let manualOrder = []; // most-recent-last, max length 2

    function computeFromPair(known) {
      const keys = Object.keys(known);
      const [a, b] = keys;
      const v = known[a];
      const w = known[b];
      const pairKey = [a, b].sort().join("");
      const result = {};

      switch (pairKey) {
        case "IV": // V,I known
          result.R = known.V / known.I;
          result.P = known.V * known.I;
          break;
        case "RV": // V,R known
          result.I = known.V / known.R;
          result.P = (known.V * known.V) / known.R;
          break;
        case "PV": // V,P known
          result.I = known.P / known.V;
          result.R = (known.V * known.V) / known.P;
          break;
        case "IR": // I,R known
          result.V = known.I * known.R;
          result.P = known.I * known.I * known.R;
          break;
        case "IP": // I,P known
          result.V = known.P / known.I;
          result.R = known.P / (known.I * known.I);
          break;
        case "PR": // R,P known
          result.V = Math.sqrt(known.P * known.R);
          result.I = Math.sqrt(known.P / known.R);
          break;
        default:
          return null;
      }
      return result;
    }

    function recompute(sourceField) {
      // Update manual order
      manualOrder = manualOrder.filter((f) => f !== sourceField);
      manualOrder.push(sourceField);
      if (manualOrder.length > 2) manualOrder.shift();

      if (manualOrder.length < 2) return;

      const known = {};
      manualOrder.forEach((f) => {
        const v = num(inputs[f]);
        if (v !== null) known[f] = v;
      });

      if (Object.keys(known).length !== 2) return;

      const computed = computeFromPair(known);
      if (!computed) return;

      Object.keys(computed).forEach((f) => {
        const val = computed[f];
        inputs[f].value = Number.isFinite(val) ? Number(val.toFixed(6)) : "";
      });
    }

    fields.forEach((f) => {
      inputs[f].addEventListener("input", () => {
        if (inputs[f].value === "") {
          manualOrder = manualOrder.filter((x) => x !== f);
          return;
        }
        recompute(f);
      });
    });

    document.getElementById("ohm-reset").addEventListener("click", () => {
      fields.forEach((f) => (inputs[f].value = ""));
      manualOrder = [];
    });
  })();

  // ---------- Panel 2: Three-phase power ----------
  (function threePhase() {
    const system = document.getElementById("tri-system");
    const V = document.getElementById("tri-V");
    const I = document.getElementById("tri-I");
    const fp = document.getElementById("tri-fp");
    const outP = document.getElementById("tri-P");
    const outS = document.getElementById("tri-S");
    const outQ = document.getElementById("tri-Q");

    function recompute() {
      const v = num(V);
      const i = num(I);
      const pf = num(fp);
      if (v === null || i === null) {
        outP.textContent = outS.textContent = outQ.textContent = "—";
        return;
      }
      const factor = system.value === "tri" ? SQRT3 : 1;
      const s = (factor * v * i) / 1000; // kVA
      outS.textContent = fmt(s) + " kVA";

      if (pf === null) {
        outP.textContent = "—";
        outQ.textContent = "—";
        return;
      }
      const p = s * pf;
      const q = s * Math.sqrt(Math.max(0, 1 - pf * pf));
      outP.textContent = fmt(p) + " kW";
      outQ.textContent = fmt(q) + " kVAR";
    }

    [system, V, I, fp].forEach((el) => el.addEventListener("input", recompute));
    system.addEventListener("change", recompute);

    // reverse calc: current from P, V, FP
    const system2 = document.getElementById("tri2-system");
    const P2 = document.getElementById("tri2-P");
    const V2 = document.getElementById("tri2-V");
    const fp2 = document.getElementById("tri2-fp");
    const outI2 = document.getElementById("tri2-I");

    function recompute2() {
      const p = num(P2);
      const v = num(V2);
      const pf = num(fp2);
      if (p === null || v === null || pf === null || pf === 0 || v === 0) {
        outI2.textContent = "—";
        return;
      }
      const factor = system2.value === "tri" ? SQRT3 : 1;
      const i = (p * 1000) / (factor * v * pf);
      outI2.textContent = fmt(i) + " A";
    }

    [system2, P2, V2, fp2].forEach((el) => el.addEventListener("input", recompute2));
    system2.addEventListener("change", recompute2);
  })();

  // ---------- Panel 3: Voltage drop ----------
  (function voltageDrop() {
    // Ohms per 1000 ft, uncoated stranded conductor (NEC Ch.9 Table 8 style DC values)
    const RESISTANCE = {
      cu: {
        "14 AWG": 3.07, "12 AWG": 1.93, "10 AWG": 1.21, "8 AWG": 0.764,
        "6 AWG": 0.491, "4 AWG": 0.308, "3 AWG": 0.245, "2 AWG": 0.194,
        "1 AWG": 0.154, "1/0 AWG": 0.122, "2/0 AWG": 0.0967, "3/0 AWG": 0.0766,
        "4/0 AWG": 0.0608, "250 kcmil": 0.0515, "300 kcmil": 0.0429,
        "350 kcmil": 0.0367, "400 kcmil": 0.0321, "500 kcmil": 0.0258,
      },
      al: {
        "14 AWG": 5.06, "12 AWG": 3.18, "10 AWG": 2.00, "8 AWG": 1.26,
        "6 AWG": 0.808, "4 AWG": 0.508, "3 AWG": 0.403, "2 AWG": 0.319,
        "1 AWG": 0.253, "1/0 AWG": 0.201, "2/0 AWG": 0.159, "3/0 AWG": 0.126,
        "4/0 AWG": 0.100, "250 kcmil": 0.0847, "300 kcmil": 0.0707,
        "350 kcmil": 0.0605, "400 kcmil": 0.0529, "500 kcmil": 0.0424,
      },
    };

    const systemEl = document.getElementById("cv-system");
    const materialEl = document.getElementById("cv-material");
    const awgEl = document.getElementById("cv-awg");
    const lengthEl = document.getElementById("cv-length");
    const lenUnitEl = document.getElementById("cv-len-unit");
    const lenUnitLabel = document.getElementById("cv-len-unit-label");
    const IEl = document.getElementById("cv-I");
    const VEl = document.getElementById("cv-V");
    const dropOut = document.getElementById("cv-drop");
    const pctOut = document.getElementById("cv-pct");
    const pctBox = document.getElementById("cv-pct-box");
    const VendOut = document.getElementById("cv-Vend");

    function populateAwg() {
      const material = materialEl.value;
      const previous = awgEl.value;
      awgEl.innerHTML = "";
      Object.keys(RESISTANCE[material]).forEach((size) => {
        const opt = document.createElement("option");
        opt.value = size;
        opt.textContent = size;
        awgEl.appendChild(opt);
      });
      if (previous && RESISTANCE[material][previous]) {
        awgEl.value = previous;
      } else {
        awgEl.value = "10 AWG";
      }
    }

    function recompute() {
      lenUnitLabel.textContent = lenUnitEl.value === "m" ? "m" : "pi";

      const material = materialEl.value;
      const size = awgEl.value;
      const ohmsPer1000ft = RESISTANCE[material][size];
      const lengthRaw = num(lengthEl);
      const i = num(IEl);
      const v = num(VEl);

      if (ohmsPer1000ft === undefined || lengthRaw === null || i === null) {
        dropOut.textContent = pctOut.textContent = VendOut.textContent = "—";
        pctBox.classList.remove("warn", "good");
        return;
      }

      const lengthFt = lenUnitEl.value === "m" ? lengthRaw * 3.28084 : lengthRaw;
      const factor = systemEl.value === "tri" ? SQRT3 : 2; // round-trip for single phase, sqrt3 for three-phase
      const drop = factor * (lengthFt / 1000) * ohmsPer1000ft * i;

      dropOut.textContent = fmt(drop) + " V";

      if (v !== null && v > 0) {
        const pct = (drop / v) * 100;
        pctOut.textContent = fmt(pct, 2) + " %";
        VendOut.textContent = fmt(v - drop) + " V";
        pctBox.classList.remove("warn", "good");
        pctBox.classList.add(pct > 3 ? "warn" : "good");
      } else {
        pctOut.textContent = "—";
        VendOut.textContent = "—";
        pctBox.classList.remove("warn", "good");
      }
    }

    materialEl.addEventListener("change", () => { populateAwg(); recompute(); });
    [systemEl, awgEl, lengthEl, lenUnitEl, IEl, VEl].forEach((el) => {
      el.addEventListener("input", recompute);
      el.addEventListener("change", recompute);
    });

    populateAwg();
    recompute();
  })();

  // ---------- Panel 4: Power factor correction ----------
  (function powerFactor() {
    const systemEl = document.getElementById("fp-system");
    const PEl = document.getElementById("fp-P");
    const VEl = document.getElementById("fp-V");
    const fpCurrentEl = document.getElementById("fp-current");
    const fpTargetEl = document.getElementById("fp-target");

    const kvarOut = document.getElementById("fp-kvar");
    const sBeforeOut = document.getElementById("fp-Sbefore");
    const sAfterOut = document.getElementById("fp-Safter");
    const iBeforeOut = document.getElementById("fp-Ibefore");
    const iAfterOut = document.getElementById("fp-Iafter");

    function recompute() {
      const p = num(PEl);
      const v = num(VEl);
      const pf1 = num(fpCurrentEl);
      const pf2 = num(fpTargetEl);

      if (p === null || pf1 === null || pf1 <= 0 || pf1 > 1) {
        kvarOut.textContent = sBeforeOut.textContent = sAfterOut.textContent = "—";
        iBeforeOut.textContent = iAfterOut.textContent = "—";
        return;
      }

      const sBefore = p / pf1;
      const q1 = sBefore * Math.sqrt(Math.max(0, 1 - pf1 * pf1));
      sBeforeOut.textContent = fmt(sBefore) + " kVA";

      const factor = systemEl.value === "tri" ? SQRT3 : 1;
      if (v !== null && v > 0) {
        const iBefore = (sBefore * 1000) / (factor * v);
        iBeforeOut.textContent = fmt(iBefore) + " A";
      } else {
        iBeforeOut.textContent = "—";
      }

      if (pf2 === null || pf2 <= 0 || pf2 > 1) {
        kvarOut.textContent = "—";
        sAfterOut.textContent = "—";
        iAfterOut.textContent = "—";
        return;
      }

      const sAfter = p / pf2;
      const q2 = sAfter * Math.sqrt(Math.max(0, 1 - pf2 * pf2));
      const kvar = q1 - q2;

      kvarOut.textContent = fmt(kvar) + " kVAR";
      sAfterOut.textContent = fmt(sAfter) + " kVA";

      if (v !== null && v > 0) {
        const iAfter = (sAfter * 1000) / (factor * v);
        iAfterOut.textContent = fmt(iAfter) + " A";
      } else {
        iAfterOut.textContent = "—";
      }
    }

    [systemEl, PEl, VEl, fpCurrentEl, fpTargetEl].forEach((el) => {
      el.addEventListener("input", recompute);
      el.addEventListener("change", recompute);
    });
  })();

  // ---------- Service worker registration ----------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
