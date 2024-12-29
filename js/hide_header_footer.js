function hideHeaderFooterWhenScrolling() {
    
    // Add scroll event to toggle header and footer    
    let isScrolling;
    const header = d3.select("#header");
    const footer = d3.select("#footer");

    d3.select(window).on("scroll", () => {
        // Clear the previous timeout
        clearTimeout(isScrolling);

        // Hide header and footer while scrolling
        header.classed("hidden", true);
        footer.classed("hidden", true);

        // Show header and footer again after scrolling stops
        isScrolling = setTimeout(() => {
            header.classed("hidden", false);
            footer.classed("hidden", false);
        }, 500);
    });

}