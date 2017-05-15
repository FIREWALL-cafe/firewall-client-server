<?php

class PrefixFilter {
  private $prefix;
  function __construct($prefix) {
    $this->prefix = $prefix;
  }

  function hasPrefix($i) {
    return strpos($i->post_name, $this->prefix) !== false;
  }
}

?>
