# Извлечение загружаемой Tuya-панели IIC-800 из Android

Цель — получить только panel/mini-app bundle после открытия страницы HO-SC-8W в INKBIRD 2.1.11. Полный профиль приложения, токены, cookies, базы данных и `shared_prefs` для анализа не нужны и не должны передаваться.

## Предпочтительная среда

- отдельный Android Emulator/AOSP образ, на котором доступен `adb root`;
- отдельная временная установка INKBIRD;
- XAPK `com.inkbird.inkbirdapp` 2.1.11;
- после входа открыть только устройство IIC-800 и дождаться полной загрузки его страницы.

Production-телефон не требуется. На обычном нерутованном телефоне Android доступ к `/data/user/0/...` обычно закрыт.

## 1. Установка XAPK

Распаковать XAPK в отдельную папку и установить базовый APK вместе со всеми его split APK:

```bash
mkdir -p inkbird-xapk
unzip INKBIRD_2.1.11_apkcombo.com.xapk.zip -d inkbird-xapk
find inkbird-xapk -name '*.apk' -print
adb install-multiple -r $(find inkbird-xapk -name '*.apk' -print)
```

Если архив содержит вложенный ZIP/XAPK, сначала распаковать и его. Не выбирать APK другого ABI вручную, пока `adb install-multiple` не покажет конфликт split-пакетов.

## 2. Загрузка панели

1. Запустить INKBIRD.
2. Войти в аккаунт.
3. Открыть карточку контроллера HO-SC-8W / IIC-800.
4. Поочерёдно открыть страницы «Состояние», ручной полив, программа, сезонная коррекция и настройки.
5. Не отправлять команды записи; достаточно дать интерфейсу загрузить ресурсы.
6. Закрыть экран устройства и остановить приложение:

```bash
adb shell am force-stop com.inkbird.inkbirdapp
```

## 3. Поиск panel/mini-app ресурсов

На rooted emulator:

```bash
adb root
adb shell 'find /data/user/0/com.inkbird.inkbirdapp/files \
  /data/user/0/com.inkbird.inkbirdapp/cache \
  /data/user/0/com.inkbird.inkbirdapp/code_cache \
  -type f -size +4k 2>/dev/null | head -n 5000'
```

В первую очередь интересуют:

- `.js`, `.mjs`, `.bundle`, `.hbc`, `.json`, `.map`;
- ZIP-пакеты без очевидного расширения;
- каталоги с именами `panel`, `miniapp`, `microapp`, `rn`, `react`, `bizbundle`, `thing`, `tuya`;
- недавно изменённые файлы, появившиеся после открытия контроллера.

Полезный поиск по точным строкам:

```bash
adb shell 'grep -RIl -E \
  "h71ip90tp4mfd6mx|normal_time|irrigation_time_all|SeaAdjValue|zonerun_state" \
  /data/user/0/com.inkbird.inkbirdapp/files \
  /data/user/0/com.inkbird.inkbirdapp/cache \
  /data/user/0/com.inkbird.inkbirdapp/code_cache \
  2>/dev/null'
```

Для бинарных/Hermes-файлов:

```bash
adb shell 'find /data/user/0/com.inkbird.inkbirdapp/files \
  /data/user/0/com.inkbird.inkbirdapp/cache \
  /data/user/0/com.inkbird.inkbirdapp/code_cache \
  -type f -size +4k -print0 2>/dev/null' \
| xargs -0 -I{} sh -c 'adb exec-out su 0 cat "{}" 2>/dev/null | strings | grep -Eqi \
  "h71ip90tp4mfd6mx|normal_time|irrigation_time_all|SeaAdjValue|publishDps" \
  && echo "{}"'
```

## 4. Формирование обезличенного архива

Нельзя включать в архив:

- `/data/user/0/com.inkbird.inkbirdapp/shared_prefs`;
- `/data/user/0/com.inkbird.inkbirdapp/databases`;
- cookies, WebView Local Storage, журнал запросов;
- файлы, содержащие account ID, access token, refresh token, local key или пароль;
- полный дамп `/data/user/0/com.inkbird.inkbirdapp`.

Копировать только найденный каталог панели или конкретные bundle/ZIP/JS/Hermes-файлы:

```bash
adb shell 'rm -rf /data/local/tmp/iic800-panel && mkdir -p /data/local/tmp/iic800-panel'
adb shell 'cp -a /ПУТЬ/К/НАЙДЕННОМУ/PANEL_BUNDLE /data/local/tmp/iic800-panel/'
adb shell 'cd /data/local/tmp && tar -czf iic800-panel.tgz iic800-panel'
adb pull /data/local/tmp/iic800-panel.tgz
```

Перед передачей проверить список:

```bash
tar -tzf iic800-panel.tgz | sed -n '1,300p'
```

## 5. Локальный анализ

```bash
python scripts/analyze_tuya_irrigation_panel.py \
  iic800-panel.tgz \
  --output-dir panel-analysis-output
```

Результаты:

- `panel-report.md` — сводка;
- `panel-contexts.txt` — короткие контексты вокруг DP и publish/encoder вызовов;
- `panel-evidence.json` — структурированные совпадения;
- `panel-inventory.json` — перечень и SHA-256 файлов.

Исходный proprietary bundle в отчёт не копируется.

## 6. Что считается достаточным доказательством

Для DP38 нужна одна функция/цепочка, в которой одновременно видны:

- DP `38` или `normal_time`;
- создание 20 байт либо 40 HEX-символов;
- преобразование номера зоны в one-hot маску;
- раскладка длительности, шести часов, шести минут, режима цикла, значения цикла, даты и flags;
- вызов `publishDps`/эквивалента.

Для DP45 нужна цепочка:

- DP `45` или `irrigation_time_all`;
- 34 байта;
- `01 01` для ручного запуска/сброса;
- восемь big-endian длительностей в первом банке;
- вызов отправки.

Пока такой код не получен, производственные записи DP38 остаются заблокированными.
