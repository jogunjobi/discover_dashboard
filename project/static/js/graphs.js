queue()
    .defer(d3.json, "/broadwayoni/dashboard")
    .await(makeGraphs);

function makeGraphs(error, projectsJson) {
	
	//Clean projectsJson data
	var dashboardProject = projectsJson;
	var dateFormat = d3.time.format("%m/%d/%Y");
	dashboardProject.forEach(function(d) {
		d["index_date"] = new Date(d["index_date"]);
		d["index_date"].setDate(1);
		d["volume"] = +d["volume"];
	});

	//Create a Crossfilter instance
	var ndx = crossfilter(dashboardProject);

	//Define Dimensions
	var dateDim = ndx.dimension(function(d) { return d["index_date"]; });
	var countryDim = ndx.dimension(function(d) { return d["country_name"]; });
	var sectorDim = ndx.dimension(function(d) { return d["sector_name"]; });
	var industryDim = ndx.dimension(function(d) { return d["industry_code"]; });
	var percentchangeDim  = ndx.dimension(function(d) { return d["price_change_percent"]; });
	var volumeDim  = ndx.dimension(function(d) { return d["volume"]; });
	var companyDim  = ndx.dimension(function(d) { return d["company_name"]; });

	//aggregation


	//Calculate metrics
	var volumeByDate = dateDim.group(); 
	var volumeBySector = sectorDim.group();
	var VolumeByIndustry = industryDim.group();
	var percentChange = percentchangeDim.group();
	var countryGroup = countryDim.group();
	var companyGroup = companyDim.group();
	var volumeByDate2 = dateDim.group().reduceSum(function(d) {
		return d["volume"];
	});	
	var volumeByCountry = countryDim.group().reduceSum(function(d) {
		return d["volume"];
	});
	var volumeBySector = sectorDim.group().reduceSum(function(d) {
		return d["volume"];
	}); //check back on this: might be volumeBySector
	var volumeByIndustry = industryDim.group().reduceSum(function(d) {
		return d["volume"];
	}); //check back on this: might be volumeByIndustry
	var percentBySector = sectorDim.group().reduceSum(function(d) {
		return d["price_change_percent"];
	});
	var top10volume = countryDim.group().reduceSum(function(d) {
		return d["volume"];
	});
	var top10percent = countryDim.group().reduceSum(function(d) {
		return d["price_change_percent"];
	});
	//var topTenVolume = companyDim.find().limit(5).sort(function(d) {
	//	return d["volume"];
	//});


	var all = ndx.groupAll();
	var totVolume = ndx.groupAll().reduceSum(function(d) {return d["volume"];});
	var totalChange = ndx.groupAll().reduceSum(function(d) {return d["price_change_percent"];});

	var max_volume = volumeByCountry.top(1)[0].value;

	//Define values (to be used in charts)
	var minDate = dateDim.bottom(1)[0]["index_date"];
	var maxDate = dateDim.top(1)[0]["index_date"];

    //Charts
	var timeChart = dc.lineChart("#time-chart"); //or dc.barChart
	var sectorChart = dc.pieChart("#sector-chart");
	var industryChart = dc.pieChart("#industry-chart");
	//var totalVolume = dc.numberDisplay("#total-volume");
	var totalVolume = dc.numberDisplay("#total-volume");
	var avgPerformance = dc.rowChart("#total-donations-nd"); //dc.numberDisplay

	//dropdownwidget
	selectField = dc.selectMenu('#menuselect').dimension(countryDim).group(countryGroup);
	//barchart
	totalVolume
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		//.dimension(countryDim)//new
		.group(totVolume)//new
		.formatNumber(d3.format(".3s"));//new
		//.group(all);

	//avgPerformance
	//	.formatNumber(d3.format("d"))
	//	.valueAccessor(function(d){return d; })
	//	.group(totalChange)
	//	.formatNumber(d3.format(".3s"));

	avgPerformance
		.width(400)
		.height(230)
        .dimension(countryDim)
        .group(top10percent)
        .xAxis().ticks(4);

	timeChart
		.width(1250)
		.height(300)
		.margins({top: 10, right: 50, bottom: 40, left: 90})
		.dimension(dateDim)
		.group(volumeByDate2) 
		.renderArea(true)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
		.xAxisLabel("Time Period")
		.yAxis().ticks(4);




	//sector pie chart	
	sectorChart
        //.width(300)
        .height(320)
        .radius(120)
        .innerRadius(50)
        .transitionDuration(1000)
        .dimension(sectorDim)
        .group(volumeBySector);


    //industry pie chart	
	industryChart
        //.width(300)
        .height(320)
        .radius(120)
        .innerRadius(50)
        .transitionDuration(1000)
        .dimension(industryDim)
        .group(volumeByIndustry);



    dc.renderAll();

};