<?php

function sba_message_action_insert_components($node) {
  module_load_include('inc', 'webform', 'includes/webform.components');

  // Limit the state field to US states.
  $fields[] = array(
    'nid' => $node->nid,
    'form_key' => 'sbp_state',
    'pid' => 0,
    'name' => t('State'),
    'type' => 'select',
    'mandatory' => 1,
    'weight' => 12,
    'email' => 1,
    'extra' => array(
      'options_source' => 'united_states',
      // May have to remove some.
      'aslist' => 'Y',
      'multiple' => 0,
    ),
  );

  $fields[] = array(
    'nid' => $node->nid,
    'form_key' => 'sbp_zip',
    'pid' => 0,
    'name' => t('Zip Code'),
    'type' => 'textfield',
    'mandatory' => 1,
    'weight' => 13,
    'email' => 1,
    'extra' => array(
      'maxlength' => 5,
    ),
  );

  $fields[] = array(
    'nid' => $node->nid,
    'form_key' => 'sba_user_edit_flag',
    'pid' => 0,
    'name' => t('User Edit Flag'),
    'type' => 'hidden',
    'value' => 0,
    'weight' => 13,
    'email' => 1,
  );

  $fields[] = array(
    'nid' => $node->nid,
    'form_key' => 'sba_deliverable_count',
    'pid' => 0,
    'name' => t('Deliverable message count'),
    'type' => 'hidden',
    'value' => 0,
    'weight' => 13,
    'email' => 1,
  );

  // Add the component to the Webform.
  foreach ($fields as $field) {
    // Don't insert fields if cloning.
    if (!isset($node->map) || (isset($node->map) &&  !in_array($field['form_key'], $node->map))) {
      $cid = webform_component_insert($field);
      // User map the state field.
      if ($field['form_key'] == 'sbp_state' || $field['form_key'] == 'sbp_zip') {
        $map = array(
          'nid' => $node->nid,
          'cid' => $cid,
          'map_id' => $field['form_key'],
        );
        drupal_write_record('webform_user_component_map', $map);
      }
    }
  }
}

function sba_message_action_prevent_component_delete(&$form, &$form_state) {
  $required_fields = array(
    'sbp_salutation' => 'sbp_salutation',
    'sbp_first_name' => 'sbp_first_name',
    'sbp_last_name' => 'sbp_last_name',
    'mail' => 'mail',
    'sbp_address' => 'sbp_address',
    'sbp_city' => 'sbp_city',
    'sbp_state' => 'sbp_state',
    'sbp_zip' => 'sbp_zip',
    'sbp_phone' => 'sbp_phone',
    'sba_deliverable_count' => 'sba_deliverable_count',
    'sba_user_edit_flag' => 'sba_user_edit_flag',
  );

  $cid = $form['component']['#value']['cid'];
  $component = $form['node']['#value']->webform['components'][$cid];

  if (in_array($component['form_key'], $required_fields)) {
    $message = t('<strong>!name</strong> is a required field and cannot be deleted from this form.',
      array('!name' => $component['name']));
    $form['description']['#markup'] = $message;
    unset($form['actions']['submit']);
  }
}

function sba_message_action_component_edit_lock(&$form) {
  $locked_fields = array(
    'sbp_salutation',
    'sbp_first_name',
    'sbp_last_name',
    'mail',
    'sbp_address',
    'sbp_city',
    'sbp_state',
    'sbp_zip',
    'sbp_phone',
    'sba_deliverable_count',
    'sba_user_edit_flag',

  );
  if (in_array($form['form_key']['#default_value'], $locked_fields)) {
    // Check the node type.
    $form['form_key']['#disabled'] = TRUE;
    $form['validation']['mandatory']['#disabled'] = TRUE;
  }
}
function sba_message_action_component_overview_lock(&$form) {
  $locked_fields = array(
    'sbp_salutation',
    'sbp_first_name',
    'sbp_last_name',
    'mail',
    'sbp_address',
    'sbp_city',
    'sbp_state',
    'sbp_zip',
    'sbp_phone',
    'sba_deliverable_count',
    'sba_user_edit_flag',
  );
  foreach ($form['#node']->webform['components'] as $cid => $component) {
    if (in_array($component['form_key'], $locked_fields)) {
      $form['components'][$cid]['mandatory']['#disabled'] = TRUE;
    }
  }
}