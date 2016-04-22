﻿import log from 'picolog';
import React, { Component, PropTypes } from 'react';
const { object, func, shape } = PropTypes;
import { Icon } from 'react-mdl';
import { Textfield } from '../Mdl/mdl-extras';
import { fromJSON, toJSON, indexOf } from '../Entity/Entity';
import classNames from 'classnames';

export class FilterFields extends Component {
	static propTypes = {
		fields: shape({
			q: object.isRequired,
		}).isRequired,
		onApplyFields: func.isRequired,
		onSearch: func.isRequired,
	}

	clearField(field, event) {
		log.info('clearField', field, event);
		event.preventDefault();
		const { onApplyFields, onSearch } = this.props;
		field.onChange('');
	}

	render() {
		const { fields, className, children } = this.props;
		const classes = classNames('FilterFields', className);
		return (
			<div className={classes}>
				<Textfield {...fields.q} placeholder="Type here..." /><a className="clear-button" href="#" onClick={this.clearField.bind(this, fields.q)}><Icon name="clear" /></a>
			</div>
		)
	}
}
export default FilterFields;
