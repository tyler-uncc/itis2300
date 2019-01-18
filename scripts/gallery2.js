$(document).ready(function() {
	$(".image-big").hide();
	$("#image-backdrop").hide();
	
	$("img.thumbnail").on("click", function() {
		$("img.image-big").attr("src", this.src);
		$(".image-big").show();
		$("#image-backdrop").show();
	});
	
	$("#image-backdrop").on("click", function(event) {
		$("#image-backdrop").hide();
		$(".image-big").hide();
		event.stopPropagation();
	});
	
	$(".image-big").on("click", function(event) {
		$("#image-backdrop").hide();
		$(".image-big").hide();
		event.stopPropagation();
	});
	
	$("div.thumbnail").on("mouseenter", function() {
		$(this).css({"border": "2px solid white"});
	});
	
	$("div.thumbnail").on("mouseleave", function() {
		$(this).css({"border": "1px solid black"});
	});
});