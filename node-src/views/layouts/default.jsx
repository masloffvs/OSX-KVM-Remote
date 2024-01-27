var React = require('react');

function DefaultLayout(props) {
	return (
		<html>
			<head>
				<title>{props.title}</title>
				<link rel="stylesheet" href="/public/style.css"/>
			</head>

			<body style={{padding: 0, margin: 0}}>
				<nav className="navbar navbar-expand-lg navbar-light">
					<div className="container">
						<div className="collapse navbar-collapse" style={{padding: '8px 14px'}}>
							<h3 style={{padding: 0, margin: 0}}>Hypervisor</h3>
						</div>
					</div>
				</nav>

				<main style={{padding: '14px 14px'}}>
					{props.children}
				</main>
			</body>
		</html>
	);
}

module.exports = DefaultLayout;