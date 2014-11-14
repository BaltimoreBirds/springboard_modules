<?php
/**
 * @file
 * The Views controller class for the Fundraiser Sustainer record entity.
 */

class FundraiserSustainerRecordViewsController extends EntityDefaultViewsController {

  /**
   * Defines the result for hook_views_data().
   *
   * For the Fundraiser Sustainer record entity. This allows filtering on
   * gateway response using "is null" and "is not null".
   *
   * @return array
   *   Data for Views.
   */
  public function views_data() {
    $data = parent::views_data();
    $table = $this->info['base table'];
    $data[$table]['gateway_resp']['filter']['allow empty'] = TRUE;

    $data[$table]['table']['join']['fundraiser_donation'] = array(
      'left_field' => 'did',
      'field' => 'did',
    );

    watchdog('debug', '<pre>' . var_export($data, TRUE) . '</pre>');
    return $data;
  }
}
