<template>
  <div class="paper container">
    <label for="sourceCode">Type your code here:</label>
    <textarea id="sourceCode">
сrThr = 1.0
</textarea>
    <div v-show="showError" class="row text-danger margin-none">
      <label>Errors:</label>
      <div id="errorsText"></div>
    </div>
    <div class="row form-group margin-bottom-none">
      <div class="col-6 col">
        <label for="autoSaveCheckbox" class="paper-radio">
          <input type="checkbox" id="autoSaveCheckbox" />
          <span>Auto save code on startup</span>
        </label>
      </div>
      <div class="col-6 col">
        <label for="autoStartCheckbox" class="paper-radio">
          <input type="checkbox" id="autoStartCheckbox" />
          <span id="autoStartSpan">Auto start code on startup</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "CodeEditor",
  props: {},
  data: function() {
    return {
      showError: false,
      errorText: ""
    };
  }
};
</script>

<style scoped>
#sourceCode {
  width: 650px;
  height: 300px;
}
</style>
