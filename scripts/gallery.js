/*
	Currently the gallery works, but it works in a way I am not satisfied with. 
	The zoom feature is also major WIP.
	
	Originally I was using a class, but I could not get classes to work with javascript for the life of me.
	I tried using the class syntax as well as the older prototype syntax.
*/

imageURLs = [];
maxImagesPerPage = 16;
currentPage = 0;

addImageURL = function(url)
{
	imageURLs.push(url);
}

isOnFirstPage = function()
{
	return currentPage == 0;
}

isOnLastPage = function()
{
	return currentPage == imageURLs.length / maxImagesPerPage - 1;
}

nextPage = function()
{
	if (!isOnLastPage())
	{
		gotoPage(currentPage + 1);
	}
}

previousPage = function()
{
	if (!isOnFirstPage())
	{
		gotoPage(currentPage - 1);
	}
}

gotoPage = function(page)
{
	currentPage = page;
	update();
}

update = function()
{
	var galleryElement = document.getElementById('gallery');
	galleryElement.innerHTML = "";
	
	for (var i = currentPage * maxImagesPerPage; i < currentPage * maxImagesPerPage + maxImagesPerPage && i < imageURLs.length; ++i)
	{
		galleryElement.innerHTML += "<div class=\"thumbnail\"><img class=\"thumbnail\" src=\"" + imageURLs[i] + "\" alt=\"Gallery Image\" onclick=\"zoom(this)\"></div>";
	}
	
	galleryElement.innerHTML += "<br class=\"clear-float\">";
	
	var prevButton = document.createElement("button");
	prevButton.appendChild(document.createTextNode("Previous Page"));
	prevButton.onclick = previousPage;
	
	var nextButton = document.createElement("button");
	nextButton.appendChild(document.createTextNode("Next Page"));
	nextButton.onclick = nextPage;
	
	galleryElement.appendChild(prevButton);
	galleryElement.appendChild(nextButton);
}

zoom = function(obj)
{
	var zoomimg = document.createElement("img");
	zoomimg.setAttribute("src", obj.getAttribute("src"));
	zoomimg.setAttribute("style", "position: absolute; top: 15px; left: 15px; width: 1000px; height: 1000px;");
	zoomimg.onclick = function() { this.remove()};
	document.body.appendChild(zoomimg);
}

window.onload = function()
{	

}