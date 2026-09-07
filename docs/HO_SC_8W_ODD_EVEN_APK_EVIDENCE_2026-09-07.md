# HO-SC-8W: Odd/Even — доказательства из APK, 07.09.2026

## Статус вывода

Установлены точная команда формы INKBIRD и алгоритм **прогноза следующего
запуска в Android-приложении**. Это не испытание календарного планировщика
прошивки контроллера. Приём записи, ответ DP38 и фактическое выполнение
полива в нечётную/чётную дату проверяются отдельно.

**Результат отдельного испытания 07.09.2026:** для зоны 7 подтверждены
приём Odd и Even, точный ответ DP38 и отсутствие изменений остальных
семи зон в каждом полном сравнении 8/8. Фотографии подтверждают индикацию
обоих режимов. См.
[результаты на приборе](HO_SC_8W_ODD_EVEN_FIELD_RESULTS_2026-09-07.md).
Ниже сохранены доказательства из APK; они не заменены предположением
о календарном исполнении прошивки. Запуски на 31-е число и 29 февраля
по-прежнему не проверены.

## Происхождение

- INKBIRD 2.1.11, versionCode 190, пакет `com.inkbird.inkbirdapp`.
- Исходный пользовательский архив `INKBIRD_2.1.11_apkcombo.com.xapk.zip`:
  SHA-256 `54825a462412d24e359b871eb6d58a43f72a47be4bd59c321d67bb368ac8a096`.
- Base APK `com.inkbird.inkbirdapp.apk` внутри XAPK:
  SHA-256 `ab276f1bf350ba8569a3ec5f48fafced49cbdff621fd15586422e34397b5c946`.
- `classes14.dex`, 10 446 524 байта:
  SHA-256 `09461bde9f57cb36d3c7cd1bb2aba3236a12a81665589462c3554335a34ffe42`.
- Полный метод `Lcom/inkbird/inkbirdapp/device/iic800/model/Iic800Model;`
  → `getOddEvenNextTime(ZLjava/util/List;)J` заново прочитан непосредственно
  из DEX. Смещение `code_item`: `0x2c8dc8`; регистров: 15.
- Проверка 07.09.2026: прямое чтение структуры DEX и независимая
  дизассемблировка Androguard дали одинаковую последовательность команд.

Сохранённые ранее выписки формы и сериализатора находятся в исследовательском
коммите `7aa523ee99ee73bac7326b92c03c8cfb93db006b`:

- [DP38_EXISTING_EDIT_PATH.md](https://github.com/NikaSir/ha-ho-sc-8w/blob/7aa523ee99ee73bac7326b92c03c8cfb93db006b/docs/research/inkbird-apk-2.1.11/DP38_EXISTING_EDIT_PATH.md):
  полный `Iic800AddPlanActivity.done`, smali 2213–2763; конструктор
  `IicZoneBean`, smali 64–82.
- [APK_PROTOCOL_METHODS_RU.md](https://github.com/NikaSir/ha-ho-sc-8w/blob/7aa523ee99ee73bac7326b92c03c8cfb93db006b/docs/research/inkbird-apk-2.1.11/APK_PROTOCOL_METHODS_RU.md):
  полные `Iic800AddPlanPresenter.setPlan` и `parseIICZoneBean`.
- [command-class-evidence.md](https://github.com/NikaSir/ha-ho-sc-8w/blob/7aa523ee99ee73bac7326b92c03c8cfb93db006b/docs/research/inkbird-apk-2.1.11/command-class-evidence.md):
  `Iic800Model.parseZoneInfo` и `setNextTime`.

## Что именно посылает форма AddPlan

В `done()` создаётся **новый** `IicZoneBean` (`.line 271`). Конструктор
присваивает номер зоны и два логических поля; целочисленные поля периода
и даты остаются нулевыми до явного присваивания.

- Odd: `setScheduleMode(1)` (`.line 279`).
- Even: `setScheduleMode(2)` (`.line 281`).
- Обе ветви сразу переходят на общий участок `:goto_12c`, минуя
  `setScheduleDay` и `setIntervalYear/Month/Day`.
- `setScheduleDay` заполняется для Weekly и Interval; дата — для Interval.
- Сериализатор пишет значения этих полей буквально, без преобразования
  режима на отдельную таблицу команд.

Нумерация байтов ниже — от нуля:

| Байт | Назначение | Odd | Even |
|---:|---|---|---|
| 0 | Маска выбираемых зон при записи | Для зоны 7: `40` | Для зоны 7: `40` |
| 1 | Длительность, минуты | Из формы | Из формы |
| 2–7 | Часы шести стартов | Из формы, пустые `FF` | Из формы, пустые `FF` |
| 8–13 | Минуты шести стартов | Из формы, пустые `FF` | Из формы, пустые `FF` |
| 14 | Режим расписания | `01` | `02` |
| 15 | Параметр периода | `00` | `00` |
| 16–18 | Год/месяц/день интервала | `00 00 00` | `00 00 00` |
| 19, старшая тетрада | Программа включена | `1` или `0` | `1` или `0` |
| 19, младшая тетрада | Учитывать датчик дождя | `1` или `0` | `1` или `0` |

Пакет — один блок 20 байт, передаваемый как 40 HEX-символов в DP38.
`setPlan()` выбирает зону через `1 << (zoneId - 1)`. В ответе первый байт
содержит номер зоны (`07` для зоны 7), а не маску (`40`). Декодер читает
байты 14–19 напрямую, без отдельной перенумерации режимов Odd/Even.

Нулевая дата в этом пакете — отсутствие даты **интервала** для другого
режима. Это не команда перевести часы прибора назад и не дата «2000-00-00».
Она также не доказывает, что прошивка обязана вернуть нули: точный ответ
должен быть проверен на приборе, без скрытой нормализации расхождений.

Отдельная операция включения существующей программы использует уже
существующий bean и может сохранять его поля. Её нельзя смешивать с
формированием новой команды через AddPlan.

## Включение, длительность и старты

`Iic800AddPlanActivity.done()` до отправки проверяет:

1. При `isChecked=true` и длительности `0` — сообщение и `return`
   (`.line 268–269`).
2. При включённой программе Weekly/Interval нулевой параметр периода
   недопустим (`.line 308–309`); эта проверка не применяется к Odd/Even.
3. При включённой программе список стартов должен быть непустым
   (`.line 311–313`).

Сам APK доказывает эти ограничения формы, но не причину реакции MCU на
нарушение ограничений. Ранее пользователь наблюдал сброс режима в Weekly
при длительности 0 и успешную запись при 10 минутах. Поэтому испытание
Odd/Even не следует смешивать с проверкой нулевой длительности: использовать
положительную длительность, сохранив её, старты и флаги из свежего снимка.

## Полный getOddEvenNextTime

Смещения слева — байты от начала инструкций метода, не от начала DEX.
Смещения переходов в выводе Androguard — единицы по 16 бит.
`v13` — аргумент `odd`; `v14` — список стартов.

```text
0000: new-instance           v0, Ljava/util/Date;
0004: invoke-direct          v0, Ljava/util/Date;-><init>()V
000a: invoke-virtual         v0, Ljava/util/Date;->getTime()J
0010: move-result-wide       v0
0012: const-wide             v2, 9223372036854775807
001c: if-eqz                 v14, +061h
0020: invoke-interface       v14, Ljava/util/List;->size()I
0026: move-result            v4
0028: if-lez                 v4, +05bh
002c: const/4                v4, 0
002e: move                   v5, v4
0030: move                   v6, v5
0032: if-nez                 v5, +056h
0036: new-instance           v7, Ljava/util/Date;
003a: invoke-direct          v7, Ljava/util/Date;-><init>()V
0040: invoke-virtual         v7, Ljava/util/Date;->getDate()I
0046: move-result            v8
0048: add-int/2addr          v8, v6
004a: invoke-virtual         v7, v8, Ljava/util/Date;->setDate(I)V
0050: invoke-virtual         v7, Ljava/util/Date;->getDate()I
0056: move-result            v8
0058: rem-int/lit8           v8, v8, 2
005c: if-eqz                 v8, +004h
0060: if-nez                 v13, +00ch
0064: invoke-virtual         v7, Ljava/util/Date;->getDate()I
006a: move-result            v8
006c: rem-int/lit8           v8, v8, 2
0070: if-nez                 v8, +034h
0074: if-nez                 v13, +032h
0078: invoke-interface       v14, Ljava/util/List;->iterator()Ljava/util/Iterator;
007e: move-result-object     v8
0080: invoke-interface       v8, Ljava/util/Iterator;->hasNext()Z
0086: move-result            v9
0088: if-eqz                 v9, +028h
008c: invoke-interface       v8, Ljava/util/Iterator;->next()Ljava/lang/Object;
0092: move-result-object     v9
0094: check-cast             v9, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;
0098: invoke-virtual         v9, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;->getHour()I
009e: move-result            v10
00a0: invoke-virtual         v7, v10, Ljava/util/Date;->setHours(I)V
00a6: invoke-virtual         v9, Lcom/inkbird/inkbirdapp/device/iic800/bean/StartTimeBean;->getMinute()I
00ac: move-result            v9
00ae: invoke-virtual         v7, v9, Ljava/util/Date;->setMinutes(I)V
00b4: invoke-virtual         v7, v4, Ljava/util/Date;->setSeconds(I)V
00ba: invoke-virtual         v7, Ljava/util/Date;->getTime()J
00c0: move-result-wide       v9
00c2: cmp-long               v11, v9, v0
00c6: if-lez                 v11, -023h
00ca: cmp-long               v11, v9, v2
00ce: if-gez                 v11, -027h
00d2: const/4                v5, 1
00d4: move-wide              v2, v9
00d6: goto                   -2bh
00d8: add-int/lit8           v6, v6, 1
00dc: goto                   -55h
00de: return-wide            v2
```

Алгоритм перебирает календарные даты начиная с сегодня; выбирает даты,
для которых `dayOfMonth % 2` соответствует аргументу. В подходящей дате
перебирает старты, выбирает ближайшее время строго позже зафиксированного
`now`, после чего возвращает результат. Переходы между месяцами делаются
через `Date.setDate`. Для пустого списка результат — `Long.MAX_VALUE`.

В **полном методе** нет исключений для 31-го числа и 29 февраля: прогноз
Android относит их к нечётным датам. Поэтому на уровне этого прогноза
31-е число и следующее 1-е могут быть двумя последовательными подходящими
днями. Прибор не испытывался на этих границах; переносить вывод о прогнозе
на исполнение расписания прошивкой нельзя.

## Как воспроизвести чтение

После распаковки base APK, с установленным Androguard:

```python
from hashlib import sha256
from pathlib import Path
from zipfile import ZipFile

from loguru import logger
logger.remove()
from androguard.core.dex import DEX

apk = Path("com.inkbird.inkbirdapp.apk")
assert sha256(apk.read_bytes()).hexdigest() == (
    "ab276f1bf350ba8569a3ec5f48fafced49cbdff621fd15586422e34397b5c946"
)
with ZipFile(apk) as archive:
    data = archive.read("classes14.dex")
assert sha256(data).hexdigest() == (
    "09461bde9f57cb36d3c7cd1bb2aba3236a12a81665589462c3554335a34ffe42"
)
for cls in DEX(data).get_classes():
    if cls.get_name() != (
        "Lcom/inkbird/inkbirdapp/device/iic800/model/Iic800Model;"
    ):
        continue
    for method in cls.get_methods():
        if method.get_name() != "getOddEvenNextTime":
            continue
        print(method.get_name(), method.get_descriptor())
        offset = 0
        for instruction in method.get_instructions():
            print(f"{offset:04x}: {instruction.get_name():22} "
                  f"{instruction.get_output()}")
            offset += instruction.get_length()
```

## Граница испытания зоны 7

Подтверждение записи должно означать полный свежий снимок 8/8, точное
совпадение целевого блока зоны 7 и отсутствие изменений остальных семи
зон. Проверяются все 20 байт, с учётом отдельного значения селектора
при записи. Длительность, шесть позиций стартов и флаги не меняются
одновременно с режимом. При расхождении — фактический результат и остановка
без автоматического повтора или отката. Прогноз APK не заменяет эту проверку.
