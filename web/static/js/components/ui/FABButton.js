import React, { Component } from 'react'
import { Button } from 'react-materialize'
import { Link } from 'react-router'

export class FABButton extends Component {
  render () {
    const { children, icon, hoverEnabled } = this.props

    return ( 
      <div ref={'fab'} className={`fixed-action-btn ${hoverEnabled ? '' : 'click-to-toggle'}`}>
        <Link className="btn-floating btn-large waves-effect waves-light green right mtop direction-bottom">
          <i className='material-icons'>{icon}</i>
        </Link>
        <ul>
          {children.map((c, i) => (<li key={`fab-button-${i}`}>{c}</li>))}
        </ul>
      </div>
    )
  }
}

