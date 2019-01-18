$(document).ready(function() {	
	$("#email-name").blur(function() {
		if ($(this).val() != '')
		{
			Cookie.set("name", $(this).val());
		}
	});
	
	$("#email").blur(function() {
	if ($(this).val() != '')
	{
		Cookie.set("email", $(this).val());
	}
	});
	
	$("#email-subject").blur(function() {
	if ($(this).val() != '')
	{
		Cookie.set("subject", $(this).val());
	}
	});
	
	$("#phone-name").blur(function() {
		if ($(this).val() != '')
		{
			Cookie.set("name", $(this).val());
		}
	});
	
	$("#phone").blur(function() {
		if ($(this).val() != '')
		{
			Cookie.set("phone", $(this).val());
		}
	});
	
	$("#phone-subject").blur(function() {
	if ($(this).val() != '')
	{
		Cookie.set("subject", $(this).val());
	}
	});
	
	if (Cookie.exists("name"))
	{
		$("#email-name").val(Cookie.get("name"));
		$("#phone-name").val(Cookie.get("name"));
	}
	
	if (Cookie.exists("email"))
	{
		$("#email").val(Cookie.get("email"));
	}
	
	if (Cookie.exists("subject"))
	{
		$("#email-subject").val(Cookie.get("subject"));
		$("#phone-subject").val(Cookie.get("subject"));
	}
	
	if (Cookie.exists("phone"))
	{
		$("#phone").val(Cookie.get("phone"));
	}
});