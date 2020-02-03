<template>
  <div id="helpContainer">
    <div id="helpCloseButton" @click="close">X</div>
    <div id="help" class="paper asd">
      <div class="h1">Что это?</div>
      <div>Это прототип игры Marsgame</div>
      <div class="h1">Что тут делать?</div>
      <div>
        Пока это игра-песочница. Можно писать программу для "меха" (робота-танка) и смотреть как он ездит и разрушает
        объекты
      </div>
      <div class="h1">На каком языке писать программу?</div>
      <div>
        Программа пишется на языке <b>Marslang</b>, "дока"
        <a href="https://github.com/justclimber/marslang">на гитхабе</a>
      </div>
      <div class="h1">Что еще нужно знать?</div>
      <div>Программу нужно сохранить и запустить. Она будет исполняться на сервере раз в 1 секунду</div>
      <div class="h1">На вход программе каждый раз будут загружаться следующие переменные:</div>
      <div><span class="code">PI</span> - число π, оно полезно при работе с углами</div>
      <div>
        <span class="code">mech</span> - структура с данными о вашем мехе: <span class="code">x</span>,
        <span class="code">y</span>, <span class="code">angle</span> (в радианах!)
      </div>
      <div>
        <span class="code">objects</span> - массив структур остальных объектов с параметрами:
        <span class="code">x</span>, <span class="code">y</span>, <span class="code">angle</span> (в радианах!)
      </div>
      <div class="h1">На выходе могут быть следующие переменные:</div>
      <div>
        float <span class="code">mThr</span>. Диапазон от <span class="code">-1.</span> до <span class="code">1.</span>
      </div>
      <div>
        float <span class="code">mrThr</span>. Диапазон от <span class="code">-1.</span> до <span class="code">1.</span>
      </div>
      <div>
        float <span class="code">crThr</span>. Диапазон от <span class="code">-1.</span> до <span class="code">1.</span>
      </div>
      <div>
        float <span class="code">shoot</span>. Диапазон от <span class="code">0</span> до
        <span class="code">max float</span>
      </div>
      <div>Если каких-то из этих переменных на выходе нет, они приравниваются к 0</div>
      <div class="h1">mThr</div>
      <div>Mech throttle, или "газ", пятка в пол на педаль. 1. - полный газ, -1. - полный обратный ход</div>
      <div class="h1">mrThr</div>
      <div>
        Mech Rotate throttle, или усилие поворота меха. 1. - максимальное вращение меха по часовой стрелке, -1. -
        максимальное вращение против часовой стрелки
      </div>
      <div class="h1">crThr</div>
      <div>
        Cannon rotate throttle, или усилие поворота башни меха. 1. - максимальное вращение башни по часовой стрелке, -1.
        - максимальное вращение против часовой стрелки
      </div>
      <div class="h1">shoot</div>
      <div>
        Выстрел. Любое, отличное от нуля положительное число - время в секундах, через сколько запланировать выстрел
      </div>
      <div class="h1">Также доступны следующие функции:</div>
      <div>
        <span class="code">distance(int x1, int y1, int x2, int y2): float</span> - возвращает дистанцию между двумя
        точками
      </div>
      <div>
        <span class="code">angle(int x1, int y1, int x2, int y2): float</span> - возвращает угол в радианах между двумя
        точками и осью OX
      </div>
      <div><span class="code">nearest(Mech, Point[]): Object</span> - возвращает ближайший к меху объект</div>
      <div class="h1">Все так просто?</div>
      <div>
        Да, но стоит учитывать, что в игре есть понятие энергии. Энергия расходуется на движение, поворот, выстрелы и
        даже на исполнение инструкций вашего кода. Если энергия заканчивается, мех начинает медленней ехать, тупить а,
        исполнение программы троттлится как поды в кубернетисе под нагрузкой!
      </div>
      <div class="h1">Зачем тут вкладки?</div>
      <div>
        Вкладки пока что просто способ сохранить код (в localStorage), чтобы эксперементировать с разные стратегиями
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import Console from "./Console.vue";

@Component
export default class Help extends Vue {
  close() {
    this.$emit("help-close");
  }
}
</script>

<style scoped>
#helpContainer {
  position: absolute;
  width: 800px;
  height: 860px;
  top: 10px;
  left: 400px;
}
#help {
  position: absolute;
  width: 800px;
  height: 860px;
  overflow: auto;
  background: rgba(255, 255, 255, 0.95);
  z-index: 9999;
  margin: 0;
}
#help .h1 {
  margin-top: 10px;
  font-size: 25px;
  font-weight: bold;
}
#help .code {
  font-family: monospace;
  color: #c08a70;
  background: #fff9fc;
  border: 1px solid #d3adab;
  padding: 0 2px;
}
#helpCloseButton {
  cursor: pointer;
  position: absolute;
  right: 25px;
  top: 15px;
  font-weight: bold;
  font-size: 35px;
  z-index: 999999;
}
</style>
