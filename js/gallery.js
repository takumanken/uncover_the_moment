// ---------------------------------------------------------
// Data Loading
// ---------------------------------------------------------
async function getAllGalleryData() {
  const data = await d3.json("../assets/data/data.json");
  const orderedData = data.sort((a, b) => a.name.localeCompare(b.name));
  return orderedData;
}

// ---------------------------------------------------------
// Initialize State Object
// ---------------------------------------------------------

let stateObject = {
  genre: [],
  gender: [],
  year: [],
  age: [],
};

async function initializeStateObject(data) {
  // Aggregate counts for each filter
  function aggregateCounts(data, accessor) {
    const rollup = d3.rollups(data, (v) => v.length, accessor);
    const sorted = rollup.sort((a, b) => b[1] - a[1]);
    return sorted.map((d) => d[0]);
  }

  // Aggregate counts
  aggGenre = aggregateCounts(data, (d) => d.categories[0]);
  aggGender = aggregateCounts(data, (d) => d.sex);
  aggPortraitYear = aggregateCounts(data, (d) => d.portraitYear.yearGroup);
  aggAge = aggregateCounts(data, (d) => d.ageAtPortrait.ageGroup);

  // Update State Object
  stateObject.genre = aggGenre;
  stateObject.gender = aggGender;
  stateObject.year = aggPortraitYear.sort();
  stateObject.age = aggAge.sort();
}

// ---------------------------------------------------------
// Populate Filter
// ---------------------------------------------------------

function createFilter(data) {
  const filters = [
    { title: "GENRE", options: ["(All)", ...stateObject.genre] },
    { title: "GENDER", options: stateObject.gender },
    { title: "YEAR", options: ["(All)", ...stateObject.year] },
    { title: "AGE", options: ["(All)", ...stateObject.age] },
  ];

  // Select the container
  const filterContainer = d3.select("#dropdown-container");

  // Create dropdowns
  filterContainer
    .selectAll(".dropdown")
    .data(filters)
    .enter()
    .append("div")
    .attr("class", "dropdown")
    .each(function (d) {
      const dropdown = d3.select(this);

      // Dropdown Button
      dropdown
        .append("div")
        .attr("class", "dropdown-btn")
        .text(d.title)
        .on("click", function (event) {
          event.stopPropagation();

          filterContainer
            .selectAll(".dropdown")
            .filter(function () {
              return this !== dropdown.node();
            })
            .classed("active", false);

          dropdown.classed("active", !dropdown.classed("active"));
        });

      // Dropdown Content
      const options = dropdown
        .append("div")
        .attr("class", "dropdown-content")
        .selectAll("label")
        .data(d.options)
        .enter()
        .append("label")
        .html((option) => `<input type="checkbox" value="${option}"> ${option}`)
        .on("click", (event) => event.stopPropagation());

      // Handle checkbox changes
      options.select("input").on("change", function () {
        const isAll = this.value === "(All)";
        const checked = this.checked;
        const checkboxes = dropdown.selectAll("input");
        const allBox = checkboxes.filter("[value='(All)']");

        // Title without "All" suffix
        const title = dropdown.select(".dropdown-btn").text();
        const total = checkboxes.size() - allBox.size();

        if (isAll) {
          // Update checkboxes when "All" is selected
          checkboxes.property("checked", checked);
        } else if (!["GENDER", "SELF PORTRAIT"].includes(title)) {
          // Update "All" checkbox when other checkboxes are selected
          const selected = checkboxes.filter(":checked").size() - (allBox.property("checked") ? 1 : 0);
          allBox.property("checked", selected === total);
        }

        // Get selected options
        const selectedOptions = checkboxes
          .filter(":checked")
          .nodes()
          .filter((cb) => cb.value !== "(All)")
          .map((cb) => cb.value);

        // Update State Object
        stateObject[title.toLowerCase()] = selectedOptions;

        // Update Filter button state
        if (stateObject[title.toLowerCase()].length !== total) {
          dropdown.select(".dropdown-btn").classed("filtered", true);
        } else {
          dropdown.select(".dropdown-btn").classed("filtered", false);
        }

        // Update data
        updateData(data);
      });
    });

  // Close dropdowns when clicking outside
  d3.select(document).on("click", () => {
    filterContainer.selectAll(".dropdown").classed("active", false);
  });
}

// ---------------------------------------------------------
// Draw Gallery
// ---------------------------------------------------------

function drawGallery(data) {
  d3.select("#count-container").selectAll("*").remove();

  d3.select("#count-container")
    .append("p")
    .html(`<span>${data.length}</span> Portraits Found`)
    .style("font-size", "16px");

  d3.select("#portrait-gallery").selectAll("*").remove();

  const gallery = d3.select("#portrait-gallery");

  const portraits = gallery
    .selectAll("div")
    .data(data)
    .enter()
    .append("div")
    .attr("class", "portrait-item")
    .on("click", (event, d) => {
      window.open(`portrait.html?id=${d.id}`, "_self");
    })
    .on("mouseover", function (event, d) {
      d3.select(this).select("p").style("visibility", "visible").style("opacity", "1");
      d3.select(this).select("img").style("filter", "brightness(0.5)").style("transform", "scale(1.03)");
    })
    .on("mouseout", function () {
      d3.select(this).select("p").style("visibility", "hidden").style("opacity", "0");
      d3.select(this).select("img").style("filter", "none").style("transform", "none");
    });

  portraits
    .append("img")
    .attr("src", (d) => `../assets/images/thumbnails/${d.id}.jpg`)
    .attr("class", "portrait-image")
    .style("width", `250px`);

  portraits
    .append("p")
    .text((d) => d.name.toUpperCase())
    .style("position", "absolute")
    .attr("class", "portrait-name");
}

// ---------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------

// Update data based on filter conditions
function updateData(data) {
  const filteredData = data.filter(
    (d) =>
      stateObject.gender.includes(d.sex) &&
      stateObject.genre.includes(d.categories[0]) &&
      stateObject.year.includes(d.portraitYear.yearGroup) &&
      stateObject.age.includes(d.ageAtPortrait.ageGroup)
  );

  // Update gallery
  drawGallery(filteredData);
}

// ---------------------------------------------------------
// Main Function
// ---------------------------------------------------------
async function main() {
  const AllGalleryData = await getAllGalleryData();
  initializeStateObject(AllGalleryData);
  createFilter(AllGalleryData);
  drawGallery(AllGalleryData);
  hideHeaderFooterWhenScrolling();
}

main();
