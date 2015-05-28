var url = "./specs/foo.json";

describe("Plugins", function() {

	it("Uses a live plugin on request", function(done) {

		function notVader(jacksRequest) {
			// All request must have this query parameter
			jacksRequest.query("iAmNot", "Vader");
		}
		jacks().get(url)
		.query("param1", "value")
		.use(notVader)
		.send(function(response) {
			expect(response.url).toBe(url + "?param1=value&iAmNot=Vader");
			done();
		});
	});

	it("Uses a live plugin on global", function(done) {
		function yoda(jacksRequest) {
			// All request must have this query parameter
			jacksRequest.query("iAm", "Yoda");
		}
		function vader(jacksResponse) {
			// All request must have this query parameter
			jacksResponse.responseText = "I'm your father";
		}
		var myJacks = jacks();
		myJacks
		.use(yoda, vader)
		.get(url)
		.query("param1", "value")
		.send(function(response) {
			expect(response.url).toBe(url + "?iAm=Yoda&param1=value");
			expect(response.responseText).toBe("I'm your father");
			// Try again to ensure that the plugin is still there
			myJacks
			.get(url)
			.query("param1", "value")
			.send(function(response) {
				expect(response.url).toBe(url + "?iAm=Yoda&param1=value");
				expect(response.responseText).toBe("I'm your father");
				done();
			});
		});

	});

	it("Uses a configured plugin on request", function(done) {

		jacks.plugin("notVader", function notVader(jacksRequest) {
			// All request must have this query parameter
			jacksRequest.query("iAmNot", "Vader");
		});
		jacks()
		.get(url)
		.query("param1", "value")
		.use("notVader")
		.send(function(response) {
			expect(response.url).toBe(url + "?param1=value&iAmNot=Vader")
			done();
		});
	});

	it("Uses a configured plugin on response", function(done) {

		jacks.plugin("Vader", null, function notVader(jacksResponse) {
			// All request must have this query parameter
			jacksResponse.responseText = "I'm your father";
		});
		jacks()
		.get(url)
		.use("Vader")
		.send(function(response) {
			expect(response.responseText).toBe("I'm your father")
			done();
		});
	});

	it("Uses a configured plugin on global", function(done) {
		jacks.plugin("yoda", function yoda(jacksRequest) {
			// All request must have this query parameter
			jacksRequest.query("iAm", "Yoda");
		});

		var myJacks = jacks();
		
		myJacks
		.use("yoda")
		.get(url)
		.query("param1", "value")
		.send(function(response) {
			expect(response.url).toBe(url + "?iAm=Yoda&param1=value")
		
			myJacks
			.get(url)
			.query("param1", "value")
			.send(function(response) {
				// Try again to that the plugin is still there
				expect(response.url).toBe(url + "?iAm=Yoda&param1=value")
				done();
			});
		});

	});
});
