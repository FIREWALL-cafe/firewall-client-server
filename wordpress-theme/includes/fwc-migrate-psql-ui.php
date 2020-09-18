<!doctype html>
<html>
<head>
	<title>Migrate WordPress to PSQL</title>
	<style>
		body {
			font-size: 0.8rem;
			line-height: 1.2;
			font-family: sans-serif;
			margin: 0.5rem;
		}

		input[type=number] {
			display: inline-block;
			font-size: 1rem;
			line-height: 2rem;
			margin: 0 0.5rem 0.5rem 0;
			border: 0;
			background: #eee;
			padding: 0 1rem;
		}

		button {
			display: inline-block;
			text-align: center;
			text-transform: uppercase;
			line-height: 2rem;
			font-size: 1rem;
			font-weight: bold;
			margin-right: 0.5rem;
			margin-bottom: 0.5rem;
			padding: 0 1rem;
			border: 0;
			cursor: pointer;
		}

		[disabled] {
			opacity: 0.8;
			cursor: not-allowed;
		}

		.block {
			background-color: #eeeeee;
			padding: 1rem;
			margin: 0 0 0.5rem 0;
			position: relative;
			clear: both;
		}

		.title {
			line-height: 1;
			font-size: 1rem;
			font-weight: bold;
			margin-top: 0;
			margin-bottom: 0.5rem;
		}

		.data {
			white-space: pre-wrap;
			font-family: 'Consolas', monospace;
		}

		.red { background-color: #ffcccc; }

		.yellow { background-color: #ffffcc; }

		.green { background-color: #ccffcc; }

		.blue { background-color: #ddeeff; }

		.purple { background-color: #ffccff; }
	</style>
</head>
<body>
	<input type="number" id="debugInput" placeholder="Search # to debug" />
	<button id="debugButton" autocomplete="off" class="purple">Debug single search</button>
	<br />
	<button id="migrateStart" autocomplete="off" class="green">Start migrate all from beginning</button>
	<button id="migrateStop" autocomplete="off" class="red">Stop migrate all</button>
	<div class="block blue">
		<h2 class="title">Migrate action</h2>
		<div id="migrateAction" class="data">N/A</div>
	</div>
	<div class="block blue">
		<h2 class="title">Migrate summary</h2>
		<div id="migrateSummary" class="data">N/A</div>
	</div>
	<div id="migrateDebug"></div>
	<script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
	<script type="text/javascript">

window.F = {
	page: 1,
	debug: 1,
	migrateAll: 0,
	migrateAllStartTime: 0,
	summaries: {}
};

$(document).on('DOMContentLoaded', function () {
	$('#debugButton').prop('disabled', !$('#debugInput').val().length);
	$('#migrateStart').prop('disabled', false);
	$('#migrateStop').prop('disabled', true);

	$('#debugInput').on('keyup', function (event) {
		$('#debugButton').prop(
			'disabled',
			!$('#debugInput').val().length || !$('#debugInput').get(0).checkValidity()
		);
		if (event.key === 'Enter' || event.keyCode === 13) {
			$('#debugButton').trigger('click');
		}
	});

	$('#debugButton').on('click', function () {
		F.page = $('#debugInput').val();
		migrateDebug();
	});

	$('#migrateStart').on('click', function () {
		migrateAllStart();
	});

	$('#migrateStop').on('click', function () {
		migrateAllStop();
	});
});

function migrateDebug() {
	F.summaries = {};
	F.debug = 1;
	migrateRequest(function (data) {
		F.summaries[F.page] = data;
		renderSummary();
		renderDebug();
	});
}

function migrateAllStart() {
	$('#debugInput').val('');
	$('#debugInput').prop('disabled', true);
	$('#debugButton').prop('disabled', true);
	$('#migrateStart').prop('disabled', true);
	$('#migrateStop').prop('disabled', false);

	F.summaries = {};
	F.page = 1;
	F.migrateAll = 1;
	F.migrateAllStartTime = (new Date()).getTime();
	F.debug = 0;
	migrateRequest(migrateAllNext);
}

function migrateAllNext(summary) {
	F.summaries[F.page] = summary;
	renderSummary();

	// Continue if receiving a summary with multiple action entries, or with only
	// an Ajax entry but errors, otherwise the request returned an empty array
	if (F.migrateAll && (
		(summary.length === 1 && summary[0].errors.length) ||
		(summary.length > 1)
	)) {
		const t = setTimeout(function () {
			F.page++;
			migrateRequest(migrateAllNext);
		}, 100);
	} else {
		F.migrateAll = 0;
	}
}

function migrateAllStop() {
	F.migrateAll = 0;

	$('#migrateStart').prop('disabled', false);
	$('#migrateStop').prop('disabled', true);
	$('#debugInput').prop('disabled', false);
}

function migrateRequest(callback) {
	const message = `Migrate page ${F.page} of ${F.migrateAll ? 'all' : 'one'}, debug ${Boolean(F.debug)}, request sent`;
	$('#migrateAction').text(message);

	$.ajax({
		type: 'POST',
		dataType: 'json',
		url: '/wp-admin/admin-ajax.php',
		data: {
			action: 'migrate_psql',
			page: F.page,
			debug: F.debug
		},
		complete: function (response) {
			const message = `Migrate page ${F.page} of ${F.migrateAll ? 'all' : 'one'}, debug ${Boolean(F.debug)}, request status code ${response.status}`;
			$('#migrateAction').text(message);

			const info = {
				action: 'ajax_request',
				debug: [],
				errors: [],
				quantity: 1
			};
			let data = [];

			// Log any Ajax errors and keep going
			if (response.status != 200) {
				info.errors.push({
					title: `Ajax request error status code ${response.status}`,
					data: response
				});
			}
			// Log non-JSON responses which indicate a PHP error
			if (response.responseJSON && response.responseJSON.data) {
				data = response.responseJSON.data;
			} else {
				info.errors.push({
					title: `Internal PHP error no JSON returned`,
					data: response.responseText
				});
			}

			const summary = [info].concat(data);

			typeof callback === 'function' && callback(summary);
		}
	});
}

function renderSummary() {
	$('#migrateDebug').empty();
	$('#migrateSummary').text('N/A')

	const pages = Object.keys(F.summaries);
	const summary = pages.reduce(function (carrier, page) {
		const summary = F.summaries[page];
		carrier.total_pages += 1;
		summary.forEach(function (element, index) {
			carrier.total_actions[element.action] = (carrier.total_actions[element.action] ?? 0) + element.quantity;
			carrier.total_errors[element.action] = (carrier.total_errors[element.action] ?? 0) + element.errors.length;
			element.errors.forEach(function (element, index) {
				element.page = page;
			});
			carrier.errors = carrier.errors.concat(element.errors);
		});
		return carrier;
	}, {
		total_time: 0,
		total_pages: 0,
		total_actions: {},
		total_errors: {},
		errors: []
	});

	const now = (new Date()).getTime();
	const minutes = Math.floor((now - F.migrateAllStartTime) / (1000 * 60));
	summary.total_time = (F.migrateAllStartTime) ? `~${minutes} minutes` : 'N/A';

	$('#migrateSummary').text(JSON.stringify(summary, null, 4));
}

function renderDebug() {
	$('#migrateDebug').empty();

	const pages = Object.keys(F.summaries);
	pages.forEach(function (page) {
		const summary = F.summaries[page];
		summary.forEach(function (element, index) {
			element.debug.forEach(function (element, index) {
				$('#migrateDebug').append(
					`<div class="block yellow">
						<h2 class="title">${element['title']}</h2>
						<div class="data">${JSON.stringify(element['data'], null, 4)}</div>
					</div>`
				);
			});
		});
	});
}

	</script>
</body>
</html>