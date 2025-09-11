$.response.contentType = "text/plain";
$.response.headers.set("Content-Language", $.session.language);
$.response.setBody("");

/* FIX - $.Session.language return nothing (LOW) */