<?php

/**
 * @file
 * Definition of springboard_advocacy_views_handler_filter_string.
 * 
 * Simplify and replace the query options provided by (the DB-oriented) parent class
 */

class springboard_advocacy_views_handler_filter_string extends views_handler_filter_string {

 function operators() {
    $operators = array(
      '=' => array(
        'title' => t('Equals'),
        'short' => t('='),
        'method' => 'op_equals',
        'values' => 1,
      ),
    );
    return $operators;
  }

  function operator_options($which = 'title') {
    $options = array();
    foreach ($this->operators() as $id => $info) {
      $options[$id] = $info[$which];
    }
    return $options;
  }

  function query() {
    $field = $this->real_field;
    $info = $this->operators();
    if (!empty($info[$this->operator]['method'])) {
      $this->{$info[$this->operator]['method']}($field);
    }
  }
  
  function op_equals($field) {
    $this->query->search_terms[$field] = $this->value;
  }
}