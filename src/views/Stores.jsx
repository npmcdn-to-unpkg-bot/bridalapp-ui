import React from 'react';

export default class Stores extends React.Component {
	render() {
		return (
			<div>
				<h1>Stores</h1>
				<p>Here you should be able to browse through nearby stores.</p>
			</div>
		);
	}
}

class StoresActionBar extends React.Component {
	render() {
		return (
			<div className="ActionBar StoresActionBar">StoresActionBar</div>
		);
	}
}

Stores.StoresActionBar = StoresActionBar;
