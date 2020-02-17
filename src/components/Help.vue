<template>
  <div id="helpContainer">
    <div id="helpCloseButton" @click="close">X</div>
    <div id="help">
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
      <div>
        <span class="code">commands</span> - структура, в которой содержатся команды меху в виде отдельных меременных
      </div>
      <div class="h1">Подробнее про commands:</div>
      <div>
        Содержимое структуры <span class="code">commands</span> - переменные и вложенные структуры, значения которых
        задают поведение вашего меха:
      </div>
      <div>
        float <span class="code">move</span>. Диапазон от <span class="code">-1.</span> до <span class="code">1.</span>.
        Default <span class="code">0.</span>
      </div>
      <div>
        float <span class="code">rotate</span>. Диапазон от <span class="code">-1.</span> до
        <span class="code">1.</span>. Default <span class="code">0.</span>
      </div>
      <div>
        float <span class="code">cannon.rotate</span>. Диапазон от <span class="code">-1.</span> до
        <span class="code">1.</span>. Default <span class="code">0.</span>
      </div>
      <div>
        float <span class="code">cannon.shoot</span>. Диапазон от <span class="code">0</span> до
        <span class="code">max float</span>. Default <span class="code">0.</span> - не стрелять
      </div>
      <div class="h1">commands.move</div>
      <div>
        Движение или "газ", пятка в пол на педаль. 1. - полный газ, -1. - полный обратный ход
      </div>
      <div class="h1">commands.rotate</div>
      <div>
        Усилие поворота меха. 1. - максимальное вращение меха по часовой стрелке, -1. - максимальное вращение против
        часовой стрелки
      </div>
      <div class="h1">commands.cannon.rotate</div>
      <div>
        Усилие поворота башни меха. 1. - максимальное вращение башни по часовой стрелке, -1. - максимальное вращение
        против часовой стрелки
      </div>
      <div class="h1">commands.cannon.shoot</div>
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
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Help extends Vue {
  close() {
    this.$emit("help-close");
  }
}
</script>

<style scoped lang="stylus">
#helpContainer
  position absolute
  width 900px
  height 700px
  top 10px
  left 200px
  border 1px solid gray
  z-index 3

#help
  height 660px
  overflow auto
  background rgba(255, 255, 255, 0.95)
  z-index 9999
  padding 20px
  .h1
    margin-top 10px
    font-size 25px
    font-weight bold
  .code
    font-family monospace
    color #c08a70
    background #fff9fc
    border 1px solid #d3adab
    padding 0 2px

#helpCloseButton
  cursor pointer
  position absolute
  right 25px
  top 15px
  font-weight bold
  font-size 35px
  z-index 999999
</style>
