import React from 'react'

export default function Alert(props) {
  const changWord = (word) => {
    if (word === "danger") {
      word = "Error";
    }
    else if (word === "success") {
      word = "Success";
    }
    return word;
  }
  return (
    <div style={{ height: '55px' }}>
      {props.alert && <div className={`alert alert-${props.alert.type}`} role="alert">
        <strong>{changWord(props.alert.type)}:</strong> {props.alert.msg}
      </div>}
    </div>
  )
}
