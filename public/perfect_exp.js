function isEastCoastDaytime() {
  // Get the current time in the Eastern timezone
  const now = new Date();
  const easternTime = now.toLocaleString("en-US", {
    timeZone: "America/New_York"
  });
  const easternDate = new Date(easternTime);

  // Check if the current time is between 6AM and 6PM EST
  const hour = easternDate.getHours();
  return hour >= 6 && hour < 18;
}

function findOptimalTrainers(
  currentExp,
  desiredExp,
  table,
  useExpNight = false,
  includeId = false,
  highestGym = undefined
) {
  console.log(JSON.stringify(table));
  const expGain = useExpNight ? "expNight" : "expDay";
  const tableFiltered = table.data
    .filter((row) => row[expGain] <= desiredExp - currentExp)
    .sort(
      (a, b) =>
        -(useExpNight ? a.expNight : a.expDay) +
        (useExpNight ? b.expNight : b.expDay)
    );
  if (highestGym)
    tableFiltered.splice(
      0,
      tableFiltered.findIndex((row) => row.number === highestGym)
    );

  let trainers = {};
  let remainingExp = desiredExp - currentExp;
  let currentExp2 = currentExp;

  for (const row of tableFiltered) {
    const expGain = useExpNight ? row.expNight : row.expDay;
    const numBattles = Math.floor(remainingExp / expGain);
    if (numBattles <= 0) continue;
    remainingExp -= numBattles * expGain;
    currentExp2 += numBattles * expGain;
    trainers[`${row.name}${includeId ? ` (${row.number})` : ""}`] = {
      numBattles,
      expAfter: currentExp2,
      expGain
    };
    if (remainingExp <= 0) break;
  }

  return trainers;
}

function getPerfectExp(level, ceil = true) {
  if (ceil) {
    return Math.pow(level + 1, 3) - 1;
  }

  return Math.pow(level, 3) + 1;
}

async function prefetchTable() {
  // Bypass CORS issue with url
  const url = "https://wiki.tppc.info/Training_Accounts?ass=randomstirng";
  // Make a GET request to the URL and get the response
  return fetch(url, {
    headers: {
      "x-requested-with": "XMLHttpRequest"
    }
  })
    .then((response) => response.text())
    .then((text) => {
      console.log();
      // Use DOMParser to parse the HTML table from the response content
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      const tableList = doc.querySelectorAll("table.wikitable");
      const table1 = tableList[0];

      // Drop the unwanted columns by their column names
      const tableRows = Array.from(table1.rows).slice(1);
      const tableData = Array.from(tableRows).map((row) => ({
        name: row.cells[0].textContent.trim().replaceAll("*", ""),
        number: parseInt(row.cells[1].textContent.trim()),
        expDay: parseInt(row.cells[6].textContent.replaceAll(",", "").trim()),
        expNight: parseInt(row.cells[7].textContent.replaceAll(",", "").trim()),
        level: row.cells[5].textContent.trim()
      }));
      const table = {
        columns: ["name", "number", "expDay", "expNight"],
        data: tableData
      };
      // Append extra trainers
      table.data.push({
        name: "illuzion lv5 MILOTIC ONLY",
        number: 24659,
        expDay: 300,
        expNight: 300
      });
      table.data.push({
        name: "shedinja SINGLE",
        number: 2380615,
        expDay: 3,
        expNight: 3
      });
      table.data.push({
        name: "shedinja w/ EXP SHARE",
        number: 2380615,
        expDay: 1,
        expNight: 1
      });

      return table;
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}

function loadTableFromJson() {
  // Same-origin so mirrors (and future domain moves) keep working.
  return fetch("data/trainers.json")
    .then((response) => response.json())
    .catch((error) => console.error(error));
}

function test() {
  const currentExp = 1;
  const desiredExp = 103;
  const table = {
    columns: ["name", "number", "expDay", "expNight"],
    data: [
      { name: "trainerA", expDay: 1, expNight: 1 },
      { name: "trainerB", expDay: 10, expNight: 10 },
      { name: "trainerC", expDay: 100, expNight: 100 }
    ]
  };

  // Example usage
  const trainers = findOptimalTrainers(currentExp, desiredExp, table, false);

  // Replace with assert statement to check the output
  if (
    JSON.stringify(trainers) !== JSON.stringify({ trainerC: 1, trainerA: 2 })
  ) {
    throw new Error("Test failed.");
  }
}

function updateTrainerSelectDropdown(table) {
  const select = document.getElementById("highest-beatable-trainer");
  select.innerHTML = "";
  const useExpNight = !isEastCoastDaytime();
  const tableSorted = table.data
    .sort(
      (a, b) =>
        -(useExpNight ? a.expNight : a.expDay) +
        (useExpNight ? b.expNight : b.expDay)
    )
    .slice(0, 10);
  const option = document.createElement("option");
  option.textContent = "Select the highest gym you can KO with Exp Freeze";
  option.disabled = true;
  select.appendChild(option);

  tableSorted.forEach((trainer) => {
    const option = document.createElement("option");
    option.value = trainer.number;
    option.textContent = `${trainer.name} (level: ${trainer.level})`;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("highestGym")) {
      const highestGym = parseInt(urlParams.get("highestGym"));
      if (trainer.number === highestGym) {
        option.selected = true;
      }
    }
    select.appendChild(option);
  });
}

async function main() {
  let table;
  try {
    table = await prefetchTable();
  } catch (error) {
    table = await loadTableFromJson();
  }
  updateTrainerSelectDropdown(table);

  const form = document.getElementById("input-form");
  const tableBody = document.querySelector("#results-table tbody");

  const currentExpInput = document.getElementById("current-exp");
  const desiredExpInput = document.getElementById("desired-exp");
  const useExpNightInput = document.getElementById("use-exp-night");
  const highestGymInput = document.getElementById("highest-beatable-trainer");
  const timeOfDayLabel = document.getElementById("time-of-day");

  const isDayTime = isEastCoastDaytime();
  useExpNightInput.checked = !isDayTime;
  timeOfDayLabel.innerText = isDayTime ? "daytime" : "nighttime";

  // Get the query parameters from the URL and set them as the form values
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("currentExp")) {
    currentExpInput.value = urlParams.get("currentExp");
  }
  if (urlParams.has("desiredExp")) {
    desiredExpInput.value = urlParams.get("desiredExp");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    // const currentExp = 15_606_381_712;
    // const desiredExp = getPerfectExp(2499); // 15624999999
    const currentExp = parseInt(currentExpInput.value);
    const desiredExp = parseInt(desiredExpInput.value);
    const highestGym = parseInt(highestGymInput.value);
    const isNightTime = useExpNightInput.checked;

    // Call findOptimalTrainers function with input values
    const trainers = findOptimalTrainers(
      currentExp,
      desiredExp,
      table,
      isNightTime,
      true,
      highestGym
    );

    const infoDiv = document.getElementById("calculation-info");
    infoDiv.innerHTML = `Training during <span class="fw-semibold">${
      isNightTime ? "NIGHT" : "DAY"
    }</span> time`;
    infoDiv.classList.remove("d-none");

    // Populate the results table
    const resultsTableBody = document
      .getElementById("results-table")
      .querySelector("tbody");
    resultsTableBody.innerHTML = "";
    const fmt = (n) => Number(n).toLocaleString("en-US");
    const parseTrainer = (label) => {
      const match = String(label).match(/^(.*?)(?:\s*\((\d+)\))?$/);
      if (!match) return { name: label, id: "" };
      return { name: (match[1] || "").trim(), id: match[2] || "" };
    };

    for (const [trainer, battleData] of Object.entries(trainers)) {
      const parsed = parseTrainer(trainer);
      const idCell = parsed.id
        ? `<div class="d-flex align-items-center justify-content-end gap-2">
             <span class="mono">${parsed.id}</span>
             <button class="btn btn-outline-secondary btn-sm copy-id" type="button" data-copy="${parsed.id}" aria-label="Copy RPG ID"><i class="bi bi-clipboard"></i></button>
           </div>`
        : "—";
      const row = document.createElement("tr");
      row.innerHTML = `
      <td>${parsed.name || trainer}</td>
      <td>${idCell}</td>
      <td>${fmt(battleData.expGain)}</td>
      <td>${fmt(battleData.numBattles)}</td>
      <td>${fmt(battleData.expAfter)}</td>
    `;
      resultsTableBody.appendChild(row);
    }

    resultsTableBody.querySelectorAll(".copy-id").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-copy") || "";
        if (!id) return;
        try {
          await navigator.clipboard.writeText(id);
        } catch (_) {
          const ta = document.createElement("textarea");
          ta.value = id;
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); } catch (e) {}
          document.body.removeChild(ta);
        }
      });
    });

    // Replace the history state with the URL params
    const params = new URLSearchParams({
      currentExp: currentExp,
      desiredExp: desiredExp,
      highestGym: highestGym
    });
    history.replaceState(null, null, "?" + params.toString());
  });

  if (!!currentExpInput.value && !!desiredExpInput.value) {
    const submitButton = document.getElementById("submit");
    submitButton.click();
  }
}
main();

module.exports = { findOptimalTrainers };
