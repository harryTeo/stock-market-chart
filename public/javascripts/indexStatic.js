/*
// Socket.io
*/
var socket = io();
socket.on('addStock', function(data) {
  addStockInfo(data);
});
socket.on('deleteStock', function(data) {
  removeStockInfo(data);
});  
// Helper Functions for Socket.io
function addStockInfo(data) {
  var htmlString = '<div class="col-xs-12 col-sm-6 col-md-4 stocksListItem" style="display:none" id="' + data.name + '"> \
											<div class="panel stock-panel"> \
											  <div class="panel-heading clearfix"> \
											    <h2 class="panel-title pull-left">' + data.name + '</h2> \
											    <div class="pull-right"><button type="button" class="close deleteStock-js"><i class="fa fa-times" aria-hidden="true"></i></button></div> \
											  </div> \
											  <div class="panel-body">' + data.description + '</div> \
											</div> \
										</div>';
	$.ajax({
    type: "GET",
    url: "https://www.quandl.com/api/v3/datasets/WIKI/" + data.name + ".json?column_index=4&order=asc&collapse=daily&start_date=2010-01-01&api_key=eKxpkKX3rwLy8bkcWGMv"
	})
	.done(function(timeSeriesdata, textStatus, jqXHR){ // Success
	  var singleSeriesData = [];
	  timeSeriesdata.dataset.data.forEach(function(dataPoint){
	  	xValue = Number(new Date(dataPoint[0]));
	  	yValue = Number(dataPoint[1]);
	  	singleSeriesData.push([xValue, yValue]);
	  });
	  $("#stocksListSection").append(htmlString);
		stocksChart.addSeries({ 
			id: data.name,                       
	    name: data.name,
	    data: singleSeriesData
		});	  
		$("#"+data.name + " .panel-title").css("color", stocksChart.get(data.name).color);
		$("#"+data.name).fadeIn(600);
	})
	.fail(function(jqXHR, textStatus, errorThrown){ // Failure
		console.log('Failed attempt to retrieve data for "' + data.name + '".');
	});
}
function removeStockInfo(data) {
	$("#"+data.name).fadeOut(600, function(){
		stocksChart.get(data.name).remove(); // Remove Stock's Time Series from Chart
	 	$("#"+data.name).remove(); // Remove Stock's Info Panel from DOM
	});
}

/*
// Get Data and Create the Chart on page load
*/
var stocksChart; // Globally available

$.getJSON("/stocks", function(data) { 
	var stocksCodes = []; // Stocks' Codes Array - Global var
	var seriesData = [];
  for(var i=0; i<data.length; i++) {
  	stocksCodes.push(data[i].name);
  }
	if (stocksCodes.length) {
		stocksCodes.forEach(function(name, index) {
		  $.getJSON("https://www.quandl.com/api/v3/datasets/WIKI/" + name.toUpperCase() + ".json?column_index=4&order=asc&collapse=daily&start_date=2010-01-01&api_key=eKxpkKX3rwLy8bkcWGMv", function(data) {
		    var singleSeriesData = [];
		    data.dataset.data.forEach(function(dataPoint){
		    	xValue = Number(new Date(dataPoint[0]));
		    	yValue = Number(dataPoint[1]);
		    	singleSeriesData.push([xValue, yValue]);
		    });
		    seriesData.push({
		    	id: name.toUpperCase(),
		      name: name.toUpperCase(),
		      data: singleSeriesData
		    });
		    // Make sure we create the chart only after all data is loaded.
		    if (seriesData.length === stocksCodes.length) {
		      stocksChart = Highcharts.stockChart('stocksChart', stocksChartOptions(seriesData), function (chart) { // apply the date pickers
	    			setTimeout(function () { $('input.highcharts-range-selector', $(chart.container).parent()).datepicker(); }, 0);
	  			});
				  for(var i=0; i<stocksCodes.length; i++) { // Color the Stock Codes according to their chart-line colors
				  	$("#"+stocksCodes[i] + " .panel-title").css("color", stocksChart.get(stocksCodes[i]).color);
				  }	  			
		      $("#loaderSection").hide();
					$("#stocksChartSection").show();
					$("#stocksListSection").show();
		    }
		  });
		});
	}
	else {
		seriesData.push({
			id: null,
		  name: null,
		  data: null
		});	
    stocksChart = Highcharts.stockChart('stocksChart', stocksChartOptions(seriesData), function (chart) { // apply the date pickers
			setTimeout(function () { $('input.highcharts-range-selector', $(chart.container).parent()).datepicker(); }, 0);
		});
	  $("#loaderSection").hide();
		$("#stocksChartSection").show();
		$("#stocksListSection").show();	
	}	  	
});
// Set the Chart Options
function stocksChartOptions(seriesData) {
	return {
	  chart: {
	    borderRadius: 5
	  },
		title: {
		  text: 'Stocks',
		  y: 25,
		  style: { "fontSize": "28px" }
		},   
	  rangeSelector: {
	    selected: 4,
	    height: 40,
	    inputStyle: {
	    	backgroundColor: "#29293d", // This is just in order to remove a white dot which, for some inexplicable reason, appears on background of "body"
	      color: '#333'
	    }    
	  },
	  yAxis: {
	    labels: {
	      formatter: function () {
	        return (this.value > 0 ? ' + ' : '') + this.value + '%';
	      }
	    },
	    plotLines: [{
	      value: 0,
	      width: 2,
	      color: 'silver'
	    }]
	  },
	  plotOptions: {
	    series: {
	      compare: 'percent',
	      showInNavigator: true
	    }
	  },
	  tooltip: {
	    pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
	    valueDecimals: 2,
	    split: true
	  },
	  series: seriesData
	};
} 
// Set the datepicker's date format
$.datepicker.setDefaults({
  dateFormat: 'yy-mm-dd',
  onSelect: function () {
    this.onchange();
    this.onblur();
  }
});

/*
// Handle HTML DOM Events
*/
// Since it is just a single-page app, no need to reload the page when click on navbar-brand
$(".navbar-default a.navbar-brand").click(function(event) {
	event.preventDefault();
});
// Focus input when relative icon is clicked
$("#newStockInputPanel .input-group-addon").click(function() {
	$("#newStockInputPanel input").focus();
});
// Handle dismiss alert/error click
$("#errorMessage a.close").click(function(event) {
	event.preventDefault();
	$("#errorMessage").fadeOut("slow", function() {
		$("#errorMessage p").html("");
	});
});
$("#newStockCodeInput").keyup(function(event){
	if(event.keyCode==46 || event.keyCode==8) {
		if($("#newStockCodeInput").val()==="") {
			$("#errorMessage").fadeOut("slow", function() {
				$("#errorMessage p").html("");
			});
		}
	}
});
// Handle New Stock Code Submission
$("#newStockCodeSubmit").click(function(event) {
	event.preventDefault();
	$("#newStockCodeSubmit").prop("disabled", true);
	$("#errorMessage").hide();
	$("#errorMessage p").html("");
	var newStockCode = $("#newStockCodeInput").val().trim().toUpperCase();
	if(newStockCode) { // Input field not empty
		$.get("/stocks", function(stocksInfo) { // Get array of currently displayed stocks
			var stocksCodes = [];
			stocksInfo.forEach(function(stockInfo) {
				stocksCodes.push(stockInfo.name);
			});
			if(stocksCodes.indexOf(newStockCode)<0) { // Inserted code does not already exist
				$.ajax({
			    type: "GET",
			    url: "https://www.quandl.com/api/v3/datasets/WIKI/" + newStockCode + ".json?column_index=4&order=asc&collapse=daily&start_date=2010-01-01&api_key=eKxpkKX3rwLy8bkcWGMv"
				})
				.done(function(data, textStatus, jqXHR){ // Success
					socket.emit('addStock', {name: data.dataset.dataset_code, description: data.dataset.name}, function(callbackData) { // 3rd argument is a callback function (for the client who initiated the request)
						if (callbackData) { // In this case we have confirmation of correct data transmition
						  var htmlString = '<div class="col-xs-12 col-sm-6 col-md-4 stocksListItem" style="display:none" id="' + data.dataset.dataset_code + '"> \
																	<div class="panel stock-panel"> \
																	  <div class="panel-heading clearfix"> \
																	    <h2 class="panel-title pull-left">' + data.dataset.dataset_code + '</h2> \
																	    <div class="pull-right"><button type="button" class="close deleteStock-js"><i class="fa fa-times" aria-hidden="true"></i></button></div> \
																	  </div> \
																	  <div class="panel-body">' + data.dataset.name + '</div> \
																	</div> \
																</div>';							
						  var singleSeriesData = [];
						  data.dataset.data.forEach(function(dataPoint){
						  	xValue = Number(new Date(dataPoint[0]));
						  	yValue = Number(dataPoint[1]);
						  	singleSeriesData.push([xValue, yValue]);
						  });
						  $("#stocksListSection").append(htmlString);
							stocksChart.addSeries({   
								id: data.dataset.dataset_code,                     
						    name: data.dataset.dataset_code,
						    data: singleSeriesData
							});	
							$("#"+data.dataset.dataset_code + " .panel-title").css("color", stocksChart.get(data.dataset.dataset_code).color);
							$("#"+data.dataset.dataset_code).fadeIn(600);  
						}
						else { // In this case we don't have confirmation of correct data transmition -> there was an error
							$("#errorMessage p").html("<strong>Error!</strong> Something went wrong - Please try again later");
							$("#errorMessage").show();
						}
					});
					$("#newStockCodeInput").val("");
					$("#newStockCodeInput").blur();
				})
				.fail(function(jqXHR, textStatus, errorThrown){ // Failure
					$("#errorMessage p").html("<strong>Error!</strong> Stock code not found. Try another code such as MSFT, AAPL, FB, GOOG...");
					$("#errorMessage").show();
					$("#newStockCodeInput").focus();
				})
				.always(function(){ // Always executed upon completion of ajax request
					$("#newStockCodeSubmit").prop("disabled", false);
				});			
			}
			else { // Inserted code already exists
				$("#errorMessage p").html("<strong>Oops!</strong> Stock code already exists.");
				$("#errorMessage").show();
				$("#newStockCodeInput").focus();
				$("#newStockCodeSubmit").prop("disabled", false);
			}
		})
		.fail(function() { // Couldn't get data from "/stocks"
			$("#errorMessage p").html("<strong>Error!</strong> Something went wrong - Please try again later");
			$("#errorMessage").show();
			$("#newStockCodeInput").blur();
			$("#newStockCodeSubmit").prop("disabled", false);
  	});		
	}
	else { // Input field is empty
		$("#newStockCodeInput").focus();
		$("#newStockCodeSubmit").prop("disabled", false);
	}
});
// Handle Stock Deletion
$("#stocksListSection").on("click", ".deleteStock-js", function(event) { // This way of handling the "click" event, makes it available on dynamically appended elements
	var stockCode = $(this).closest(".stocksListItem").attr("id");
	socket.emit('deleteStock', {name: stockCode}, function(callbackData) {
		if (callbackData) { // In this case we have confirmation of correct data transmition
			removeStockInfo({name: stockCode});
		}
	});
});