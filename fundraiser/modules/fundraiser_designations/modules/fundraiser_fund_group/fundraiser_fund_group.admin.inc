<?php

/**
 * @file
 * SBA Message editing UI.
 */

/**
 * UI controller.
 */
class FundGroupUIController extends EntityDefaultUIController {
  /**
   * Overrides hook_menu() defaults.
   */
  public function hook_menu() {

    $items = array();
    $id_count = count(explode('/', $this->path));
    $wildcard = isset($this->entityInfo['admin ui']['menu wildcard']) ? $this->entityInfo['admin ui']['menu wildcard'] : '%' . $this->entityType;
    // @todo the menu type and context definitions here are definitely
    // not "correct" but they do allow the tabs to remain consistent
    // throughout editing workflow.
    foreach (fundraiser_fund_group_get_types() as $type) {
      $items[$this->path . '/add/' . $type->type] = array(
        'title' => 'Add ' . $type->label,
        'page callback' => 'fundraiser_fund_group_form_wrapper',
        'page arguments' => array($type->type),
        'access callback' => 'fundraiser_fund_group_access',
        'access arguments' => array('create', 'create ' . $type->type),
        'file' => 'fundraiser_fund_group.admin.inc',
        'file path' => drupal_get_path('module', $this->entityInfo['module']),
        'type' => MENU_DEFAULT_LOCAL_TASK,
        'context' => MENU_CONTEXT_INLINE,
      );
    }

    // Loading and editing fundraiser_fund_group entities.
    $items[$this->path . '/fundraiser_fund_group/' . $wildcard] = array(
      'page callback' => 'fundraiser_fund_group_form_wrapper',
      'page arguments' => array($id_count + 1),
      'access callback' => 'fundraiser_fund_group_access',
      'access arguments' => array('edit', $id_count + 1),
      'weight' => 0,
      'file' => 'fundraiser_fund_group.admin.inc',
      'file path' => drupal_get_path('module', $this->entityInfo['module']),
      'type' => MENU_LOCAL_TASK,
    );
    $items[$this->path . '/fundraiser_fund_group/' . $wildcard . '/edit'] = array(
      'title' => 'Edit',
      'type' => MENU_DEFAULT_LOCAL_TASK,
      'weight' => -10,
    );
    $items[$this->path . '/fundraiser_fund_group/' . $wildcard . '/delete'] = array(
      'title' => 'Delete',
      'page callback' => 'fundraiser_fund_group_delete_form_wrapper',
      'page arguments' => array($id_count + 1),
      'access callback' => 'fundraiser_fund_group_access',
      'access arguments' => array('delete', $id_count + 1),
      'type' => MENU_LOCAL_TASK,
      'context' => MENU_CONTEXT_INLINE,
      'weight' => 10,
      'file' => 'fundraiser_fund_group.admin.inc',
      'file path' => drupal_get_path('module', $this->entityInfo['module']),
    );
    return $items;
  }
}

/**
 * Form callback wrapper: create or edit a fundraiser_fund_group.
 *
 * @param $fundraiser_fund_group
 *   The fundraiser_fund_group object being edited by this form.
 *
 * @return array
 *   The message page render array.
 *
 * @see fundraiser_fund_group_edit_form()
 */
function fundraiser_fund_group_form_wrapper($fundraiser_fund_group) {
  if (is_string($fundraiser_fund_group)) {
    $fundraiser_fund_group = fundraiser_fund_group_create(array('type' => $fundraiser_fund_group));
  }
  $build = array();
  $build['#attached']['css'] = array(
    drupal_get_path('module', 'fundraiser_fund_group') . '/css/fundraiser_fund_group.css',
    'https://fonts.googleapis.com/css?family=Open+Sans:300italic,400italic,600italic,700italic,800italic,400,300,600,700,800',
  );

  $build['#attached']['js'] = array(
    drupal_get_path(
      'module',
      'fundraiser_fund_group'
    ) . '/js/fundraiser_fund_group.js' => array('group' => JS_THEME, 'weight' => 99999),
  );
  $node = node_load(arg(1));
  $build['content'] = array(
    'fundraiser_fund_group_edit_form' => drupal_get_form('fundraiser_fund_group_edit_form', $fundraiser_fund_group, $node),
  );
  return $build;
}

/**
 * Form callback wrapper: delete a fundraiser_fund_group.
 *
 * @param $fundraiser_fund_group
 *   The fundraiser_fund_group object being edited by this form.
 *
 * @return mixed
 *   A rendered delete from.
 *
 * @see fundraiser_fund_group_edit_form()
 */
function fundraiser_fund_group_delete_form_wrapper($fundraiser_fund_group) {
  // Add the breadcrumb for the form's location.
  return drupal_get_form('fundraiser_fund_group_delete_form', $fundraiser_fund_group);
}

/**
 * Message create/edit form.
 *
 * This is where all the targeting elements are added.
 *
 * @param $form
 *   The form array.
 * @param $form_state
 *    The form meta-data and values.
 * @param $fundraiser_fund_group
 *
 * @return mixed
 */
function fundraiser_fund_group_edit_form($form, &$form_state, $fundraiser_fund_group, $node) {

  if(!empty($node)) {
    $form_state['storage']['node'] = $node;
  }
  else {
    drupal_set_message(t('Node object could not be loaded.'), 'error');
  }

  $form = array(
    '#prefix' => '<div id="springboard-advocacy-message-form-container">',
    '#suffix' => '</div>',
  );

  // Add the field related form elements.
  $form_state['fundraiser_fund_group'] = $fundraiser_fund_group;
  field_attach_form('fundraiser_fund_group', $fundraiser_fund_group, $form, $form_state);
  $form['parent_node']['nid'] = array(
    '#type' => 'hidden',
    '#value' => $form_state['storage']['node']->nid,
  );

  // Add the default field elements.
  $form['name'] = array(
    '#type' => 'textfield',
    '#title' => t('Title'),
    '#default_value' => isset($fundraiser_fund_group->name) ? $fundraiser_fund_group->name : '',
    '#maxlength' => 255,
    '#required' => TRUE,
    '#weight' => -5,
  );
  
  $form['data']['#tree'] = TRUE;
  // Get/Set the message UUID.
  $form['data']['message_id'] = array(
    '#type' => 'hidden',
    '#value' => isset($fundraiser_fund_group->data['message_id']) ? $fundraiser_fund_group->data['message_id'] : str_replace(' ', '-', uniqid(substr(variable_get('site_name', ''), 0, 10) . '-' . substr($node->title, 0, 10) . '-')),
  );

  $form['data']['recipients'] = array(
    '#type' => 'hidden',
    '#default_value' => isset($fundraiser_fund_group->data['recipients']) ? str_replace('"', '&quot;', $fundraiser_fund_group->data['recipients']) : '',
  );

  $form['data']['group_id'] = array(
    '#type' => 'hidden',
    '#default_value' => isset($fundraiser_fund_group->data['group_id']) ? $fundraiser_fund_group->data['group_id'] : '',
  );

  $form['data']['precedence'] = array(
    '#type' => 'hidden',
    '#default_value' => isset($node->precedence) ? $node->precedence : 0,
  );

  if (empty($fundraiser_fund_group->is_new)) {
    $form['data']['weight'] = array(
      '#type' => 'hidden',
      '#default_value' => isset($fundraiser_fund_group->data['weight']) ? $fundraiser_fund_group->data['weight'] : NULL,
    );
  }

  if (isset($fundraiser_fund_group->data['group_id']) && $fundraiser_fund_group->data['group_id'] == 'no_response') {
    drupal_set_message('A remote group ID could not be found.');
    watchdog('advocacy', 'A remote group ID could not be found. Local ID: @message', array('@message' => $fundraiser_fund_group->data['group_id']), WATCHDOG_ERROR);
  }

  $form['actions'] = array(
    '#type' => 'container',
    '#attributes' => array('class' => array('form-actions')),
    '#weight' => 400,
  );

  $submit = array();

  if (!empty($form['#submit'])) {
    $submit += $form['#submit'];
  }

  $form['message_error'] = array(
    '#markup' => '',
    '#prefix' => '<div id = "advo-error-wrapper">',
    '#suffix' => '</div>',
    '#weight' => 10,
  );

  $form['actions']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save group'),
    '#submit' => $submit + array('fundraiser_fund_group_edit_form_submit'),
  );

  // We append the validate handler to #validate in case a form callback_wrapper
  // is used to add validate handlers earlier.
  $form['#validate'][] = 'fundraiser_fund_group_edit_form_validate';
  return $form;
}


/**
 * Form API validate callback for the fundraiser_fund_group form.
 *
 * @param $form
 *   The form array.
 * @param $form_state
 *    The form meta-data and values.
 */
function fundraiser_fund_group_edit_form_validate(&$form, &$form_state) {
  $fundraiser_fund_group = $form_state['fundraiser_fund_group'];
  // Notify field widgets to validate their data.
  field_attach_form_validate('fundraiser_fund_group', $fundraiser_fund_group, $form, $form_state);
}


/**
 * Form API submit callback for the fundraiser_fund_group form.
 *
 * @param $form
 *   The form array.
 * @param $form_state
 *    The form meta-data and values.
 */
function fundraiser_fund_group_edit_form_submit(&$form, &$form_state) {

  $fundraiser_fund_group = entity_ui_controller('fundraiser_fund_group')->entityFormSubmitBuildEntity($form, $form_state);
  // Add in created and changed times.
  $is_new = FALSE;
  if ($fundraiser_fund_group->is_new = isset($fundraiser_fund_group->is_new) ? $fundraiser_fund_group->is_new : 0) {
    $fundraiser_fund_group->created = time();
    $is_new = TRUE;
  }

  $fundraiser_fund_group->changed = time();

  $status = $fundraiser_fund_group->save();
  if ($status) {
    drupal_set_message(t('Message saved.'));
  }

  $wrapper = entity_metadata_wrapper('fundraiser_fund_group', $fundraiser_fund_group);
  $nid = $wrapper->field_ffg_form_id->value()->nid;
  // Set a weight and an entry in the draggableviews table
  // if there is no weight.
  if (!isset($fundraiser_fund_group->data['weight']) && isset($fundraiser_fund_group->fundraiser_fund_group_id)) {
    $arg = json_encode(array($nid));
    // Create new order record.
    $weight = db_query("SELECT MAX(weight) FROM {draggableviews_structure} WHERE view_name = :name and args = :arg",
      array(':name' => 'fundraiser_fund_groups_node', ':arg' => $arg))->fetchField();

    $fundraiser_fund_group->data['weight']  = $weight + 1;
    $fundraiser_fund_group->save();

    fundraiser_fund_group_draggable_save($arg, $fundraiser_fund_group->fundraiser_fund_group_id, $fundraiser_fund_group->data['weight']);
  }

  $form_state['redirect'] = 'node/' . $nid . '/designations';
}


/**
 * Form API submit callback for the delete button.
 *
 * @param $form
 *   The form array.
 * @param $form_state
 *    The form meta-data and values.
 */
function fundraiser_fund_group_form_submit_delete(&$form, &$form_state) {
  $nid =  $form_state['values']['nid'];
  $form_state['redirect'] = 'node/' . $nid . '/messages/fundraiser_fund_group/' . $form_state['fundraiser_fund_group']->fundraiser_fund_group_id . '/delete';
}


/**
 * Form callback: confirmation form for deleting a fundraiser_fund_group.
 *
 * @see confirm_form()
 *
 * @param $form
 *   The form array.
 * @param $form_state
 *    The form meta-data and values.
 * @param $fundraiser_fund_group  The fundraiser_fund_group to delete
 *
 * @return mixed
 */
function fundraiser_fund_group_delete_form($form, &$form_state, $fundraiser_fund_group) {
  $form_state['fundraiser_fund_group'] = $fundraiser_fund_group;
  $wrapper = entity_metadata_wrapper('fundraiser_fund_group', $fundraiser_fund_group);
  $nid = $wrapper->field_ffg_form_id->value()->nid;

  $form['#submit'][] = 'fundraiser_fund_group_delete_form_submit';

  $form = confirm_form($form,
    t('Are you sure you want to delete fundraiser_fund_group %name?', array('%name' => $fundraiser_fund_group->name)),
    'node/' . $nid . '/messages/fundraiser_fund_group',
    '<p>' . t('This action cannot be undone.') . '</p>',
    t('Delete'),
    t('Cancel'),
    'confirm'
  );
  
  return $form;
}

/**
 * Submit callback for fundraiser_fund_group_delete_form
 * @param $form
 *   The form array.
 * @param $form_state
 *    The form meta-data and values.
 */
function fundraiser_fund_group_delete_form_submit($form, &$form_state) {
  // Delete the message.
  $fundraiser_fund_group = $form_state['fundraiser_fund_group'];
  $wrapper = entity_metadata_wrapper('fundraiser_fund_group', $fundraiser_fund_group);
  $nid = $wrapper->field_ffg_form_id->value()->nid;
  fundraiser_fund_group_delete($fundraiser_fund_group);
  drupal_set_message(t('%name has been deleted.', array('%name' => $fundraiser_fund_group->name)));
  watchdog('fundraiser_fund_group', 'Deleted fundraiser_fund_group: %name.', array('%name' => $fundraiser_fund_group->name));
  $form_state['redirect'] = 'node/' . $nid . '/designations';
}