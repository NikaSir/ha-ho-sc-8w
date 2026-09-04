# IIC-800 — точные методы команд из APK INKBIRD 2.1.11

> Автоматически извлечено из `docs/research/inkbird-apk-2.1.11/command-class-evidence.md`. Полный APK и полный декомпилированный исходник в репозитории не хранятся.

## Выводы, непосредственно подтверждённые кодом

1. DP45 `01 01` — старт выбранных зон в последовательном режиме.
2. DP45 `02 01` — изменение уже запущенного набора выбранных зон.
3. DP45 `01 00` — старт/сброс общего (одновременного) режима; с нулевыми банками штатное приложение выполняет общий стоп.
4. DP45 `02 00` — изменение уже запущенного общего/одновременного режима.
5. DP45 `00 00` + 32 нулевых байта — безопасный запрос актуальных ручных времён, а не команда остановки.
6. DP38 при записи использует one-hot маску зоны `1 << (zone - 1)`.
7. Старшая тетрада байта 19 DP38 — отдельный флаг включения программы.
8. Младшая тетрада байта 19 DP38 — отдельный зональный флаг, названный в bean `SeaAdjSwitch`.
9. По коду Activity поле `SeaAdjSwitch` связано с переключателем «Obey/Ignore Rain Sensor», а не с глобальным DP103.
10. DP102 — глобальное включение/выключение входа датчика дождя.
11. DP103 — прямое целочисленное значение сезонной коррекции.
12. DP109 `true` — подтверждённая штатная команда очистки/приглушения временной тревоги.
13. Из доказательных фрагментов восстановлено 26 целевых методов; 24 имеют полный баланс фигурных скобок в сохранённом диапазоне.

## Все найденные отправки DP в целевых методах

| Класс | Метод | DP | Выражение значения |
|---|---|---:|---|
| `Iic800Presenter` | `initNormalTime` | `38` | `"0000000000000000000000000000000000000000"` |
| `Iic800Presenter` | `clearAlarm` | `109` | `true` |
| `Iic800ManualPresenter` | `stopManual` | `45` | `"01" + StringUtils.intToHex(i2` |
| `Iic800ManualPresenter` | `stopAllManual` | `45` | `"010000000000000000000000000000000000"` |
| `Iic800ManualPresenter` | `stopAllManual` | `45` | `"0100000000000000000000000000000000000000000000000000"` |
| `Iic800ManualPresenter` | `stopAllManual` | `45` | `"01000000000000000000000000000000000000000000000000000000000000000000"` |
| `Iic800ManualPresenter` | `startManuals` | `45` | `"0101" + ((Object) sb) + ((Object) sb2)` |
| `Iic800ManualPresenter` | `startManuals2` | `45` | `"0101" + ((Object) sb) + ((Object) sb2)` |
| `Iic800ManualPresenter` | `changeManuals` | `45` | `"0201" + ((Object) sb) + ((Object) sb2)` |
| `Iic800ManualPresenter` | `startAllManual` | `45` | `"0100" + ((Object) sb) + ((Object) sb2)` |
| `Iic800ManualPresenter` | `changeAllManual` | `45` | `"0200" + ((Object) sb) + ((Object) sb2)` |
| `Iic800SchedulePresenter` | `startManuals` | `45` | `"0201" + ((Object) sb) + ((Object) sb2)` |
| `Iic800SchedulePresenter` | `stopManual` | `45` | `"0201" + ((Object) sb) + ((Object) sb2)` |
| `Iic800SchedulePresenter` | `setPlan` | `38` | `parseIICZoneBean(1 << (iicZoneBean.getZoneId() - 1)` |
| `Iic800SchedulePresenter` | `setScheduleTime` | `38` | `sb.toString()` |
| `Iic800AddPlanPresenter` | `reset` | `38` | `StringUtils.intToHex(1 << (this.iicZoneBean.getZoneId() - 1)` |
| `Iic800AddPlanPresenter` | `setPlan` | `38` | `parseIICZoneBean(1 << (iicZoneBean.getZoneId() - 1)` |
| `Iic800AddPlanPresenter` | `setPlan` | `38` | `parseIICZoneBean(num` |
| `Iic800SettingsPresenter` | `changeRainSensor` | `102` | `Boolean.valueOf(!this.mModel.getRainSenTotal(deviceBean))` |
| `Iic800SettingsPresenter` | `changeMainValve` | `111` | `true` |
| `Iic800SettingsPresenter` | `changeSeaAdjValue` | `103` | `Integer.valueOf(i2)` |
| `Iic800SettingsPresenter` | `resetDevice` | `105` | `true` |
| `Iic800SettingsPresenter` | `setPowerStatus` | `101` | `"OFF"` |
| `Iic800SettingsPresenter` | `setPowerStatus` | `101` | `"Auto"` |

## Протокольная матрица DP45

| command | mode | Штатное назначение | Банки времени |
|---:|---:|---|---|
| `00` | `00` | запрос/обновление телеметрии ручного полива | 16 × `0000` |
| `01` | `01` | старт выбранных зон по очереди; также пересборка/остановка выбранной зоны | первый банк — длительность/остаток, второй — уже полито |
| `02` | `01` | изменить действующую последовательную операцию | первый банк — новое значение, второй — уже полито |
| `01` | `00` | старт всех зон одновременно; при нулевых банках — общий стоп | восемь значений + восемь значений |
| `02` | `00` | изменить действующую одновременную операцию | восемь значений + восемь значений |

`mode=01` соответствует последовательному набору зон, `mode=00` — одновременному/общему режиму. В APK этот байт называется `manualMode`; он считывается из байта 1 отчёта DP45.

## Точный хвост DP38

Штатный декодер приложения разбирает последние два HEX-символа независимо:

```text
char 38 (старшая тетрада byte 19) → enable программы зоны
char 39 (младшая тетрада byte 19) → per-zone Obey/Ignore Rain Sensor
```

Название bean-поля `SeaAdjSwitch` вводит в заблуждение. Activity связывает его с `sensorGroup` и ресурсами `iic800_rain_sensor_obey` / `iic800_rain_sensor_ignore`. Сезонная коррекция передаётся отдельно через числовой DP103.

## Извлечённые методы

### `com.inkbird.inkbirdapp.device.iic800.model.Iic800Model.parseZoneInfo`

Статус: **частичный сохранённый диапазон**.

```java
00024:     public IicZoneBean parseZoneInfo(List<IicZoneBean> list, Object obj, DeviceBean deviceBean) {
00025:         String string = obj.toString();
00026:         IicZoneBean iicZoneBean = new IicZoneBean(Integer.parseInt(string.substring(0, 2)));
00027:         if (string.length() != 40 || !list.contains(iicZoneBean)) {
00028:             return iicZoneBean;
00029:         }
00030:         int iIndexOf = list.indexOf(iicZoneBean);
00031:         IicZoneBean iicZoneBean2 = list.get(iIndexOf);
00032:         int iIntValue = Integer.valueOf(string.substring(2, 4), 16).intValue();
00033:         iicZoneBean2.setRunTime(iIntValue);
00034:         ArrayList arrayList = new ArrayList();
00035:         String strSubstring = string.substring(4, 16);
00036:         String strSubstring2 = string.substring(16, 28);
00037:         int i2 = 0;
00038:         while (i2 < 6) {
00039:             int i3 = i2 * 2;
00040:             i2++;
00041:             int i4 = i2 * 2;
00042:             String strSubstring3 = strSubstring.substring(i3, i4);
00043:             String strSubstring4 = strSubstring2.substring(i3, i4);
00044:             if (!strSubstring3.equals("FF") || !strSubstring4.equals("FF")) {
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800Presenter.initNormalTime`

Статус: **полный метод**.

```java
00198:     private void initNormalTime() {
00199:         DeviceUtils.sendCommand("38", "0000000000000000000000000000000000000000", this.mDevice);
00200:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800Presenter.getWateringTime`

Статус: **полный метод**.

```java
00202:     public void getWateringTime() {
00203:         this.mHandler.postDelayed(this.getManualTime, 400L);
00204:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800Presenter.clearAlarm`

Статус: **полный метод**.

```java
00237:     public void clearAlarm() {
00238:         ProgressUtils.showLoadingViewFullPage(this.mContext);
00239:         DeviceUtils.sendCommand("109", true, this.mDevice, this.resultCallback);
00240:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800Presenter.onDpUpdate`

Статус: **частичный сохранённый диапазон**.

```java
00247:     public void onDpUpdate(String str, String str2) {
00248:         Object obj;
00249:         Object obj2;
00250:         Log.i("mytag", str2);
00251:         if (str.equals(this.devId)) {
00252:             DeviceBean deviceBean = ThingHomeSdk.getDataInstance().getDeviceBean(str);
00253:             JSONObject object = JSON.parseObject(str2);
00254:             if (object.containsKey("38") && (obj2 = object.get("38")) != null && !"0000000000000000000000000000000000000000".equals(obj2.toString())) {
00255:                 IicZoneBean zoneInfo = this.mModel.parseZoneInfo(this.zoneBeans, obj2, deviceBean);
00256:                 if (zoneInfo.getZoneId() == this.zoneBeans.size()) {
00257:                     this.mView.deviceAlarm(zoneInfo.isAlarm());
00258:                     Iterator<IicZoneBean> it = this.zoneBeans.iterator();
00259:                     while (it.hasNext()) {
00260:                         EventBus.getDefault().post(it.next());
00261:                     }
00262:                 }
00263:             }
00264:             if (object.containsKey("45")) {
00265:                 Object obj3 = object.get("45");
00266:                 String string = obj3 != null ? obj3.toString() : "00000000000000000000000000000000000000000000000000000000000000000000";
00267:                 int iIntValue = Integer.valueOf(string.substring(2, 4), 16).intValue();
00268:                 String strSubstring = string.substring(4);
00269:                 for (IicZoneBean iicZoneBean : this.zoneBeans) {
00270:                     iicZoneBean.setManualMode(iIntValue);
00271:                     iicZoneBean.setRemainTime(Integer.valueOf(strSubstring.substring((iicZoneBean.getZoneId() - 1) * 4, iicZoneBean.getZoneId() * 4), 16).intValue());
00272:                     if (Iic800Constant.devType.equals(Iic800Constant.IIC_400)) {
00273:                         iicZoneBean.setWateredTime(Integer.valueOf(strSubstring.substring(((iicZoneBean.getZoneId() - 1) * 4) + 16, (iicZoneBean.getZoneId() * 4) + 16), 16).intValue());
00274:                     } else if (Iic800Constant.devType.equals(Iic800Constant.IIC_600)) {
00275:                         iicZoneBean.setWateredTime(Integer.valueOf(strSubstring.substring(((iicZoneBean.getZoneId() - 1) * 4) + 24, (iicZoneBean.getZoneId() * 4) + 24), 16).intValue());
00276:                     } else {
00277:                         iicZoneBean.setWateredTime(Integer.valueOf(strSubstring.substring(((iicZoneBean.getZoneId() - 1) * 4) + 32, (iicZoneBean.getZoneId() * 4) + 32), 16).intValue());
00278:                     }
00279:                     EventBus.getDefault().post(iicZoneBean);
00280:                 }
00281:             }
00282:             if (object.containsKey("101")) {
00283:                 Object obj4 = object.get("101");
00284:                 String string2 = obj4 != null ? obj4.toString() : "OFF";
00285:                 for (IicZoneBean iicZoneBean2 : this.zoneBeans) {
00286:                     iicZoneBean2.setWorkMode(string2);
00287:                     if ("Auto".equals(string2) || "OFF".equals(string2)) {
00288:                         iicZoneBean2.setManualTime(0);
00289:                     }
00290:                 }
00291:                 updateNextTime();
00292:             }
00293:             if (object.containsKey("102")) {
00294:                 Object obj5 = object.get("102");
00295:                 boolean z = obj5 != null && ((Boolean) obj5).booleanValue();
00296:                 for (IicZoneBean iicZoneBean3 : this.zoneBeans) {
00297:                     iicZoneBean3.setTotalSeaSwitch(z);
00298:                     EventBus.getDefault().post(iicZoneBean3);
00299:                 }
00300:             }
00301:             if (object.containsKey("103")) {
00302:                 Object obj6 = object.get("103");
00303:                 int iIntValue2 = obj6 != null ? ((Integer) obj6).intValue() : 0;
00304:                 for (IicZoneBean iicZoneBean4 : this.zoneBeans) {
00305:                     iicZoneBean4.setAdjustValue(iIntValue2);
00306:                     EventBus.getDefault().post(iicZoneBean4);
00307:                 }
00308:             }
00309:             if (object.containsKey("104")) {
00310:                 Object obj7 = object.get("104");
00311:                 String strIntToHex = StringUtils.intToHex(obj7 != null ? ((Integer) obj7).intValue() : 0, 8);
00312:                 boolean zEquals = "1".equals(strIntToHex.substring(1, 2));
00313:                 int i2 = Integer.parseInt(strIntToHex.substring(2, 3), 16);
00314:                 int i3 = Integer.parseInt(strIntToHex.substring(3, 4), 16);
00315:                 for (IicZoneBean iicZoneBean5 : this.zoneBeans) {
00316:                     if (iicZoneBean5.getZoneId() == i3) {
00317:                         iicZoneBean5.setWateringSwitch(zEquals);
00318:                         if (zEquals && "Auto".equals(iicZoneBean5.getWorkMode())) {
00319:                             this.mModel.setNextTime(iicZoneBean5);
00320:                         }
00321:                     }
00322:                 }
00323:                 if (i3 == this.zoneNum || i2 != 0) {
00324:                     Iterator<IicZoneBean> it2 = this.zoneBeans.iterator();
00325:                     while (it2.hasNext()) {
00326:                         EventBus.getDefault().post(it2.next());
00327:                     }
00328:                     if (deviceBean != null) {
00329:                         Object obj8 = deviceBean.getDps().get("101");
00330:                         this.mView.setCurrentFragment(obj8 != null ? obj8.toString() : "OFF");
00331:                     }
00332:                 }
00333:             }
00334:             if (object.containsKey("106")) {
00335:                 Object obj9 = object.get("106");
00336:                 boolean z2 = obj9 != null && ((Boolean) obj9).booleanValue();
00337:                 Iterator<IicZoneBean> it3 = this.zoneBeans.iterator();
00338:                 while (it3.hasNext()) {
00339:                     it3.next().setAlarm(z2);
00340:                 }
00341:                 this.mView.deviceAlarm(z2);
00342:             }
00343:             if (object.containsKey("107")) {
00344:                 for (IicZoneBean iicZoneBean6 : this.zoneBeans) {
00345:                     if ("Auto".equals(iicZoneBean6.getWorkMode())) {
00346:                         this.mModel.setNextTime(iicZoneBean6);
00347:                     }
00348:                 }
00349:                 updateNextTime();
00350:             }
00351:             if (object.containsKey("108")) {
00352:                 int iIntValue3 = ((Integer) object.get("108")).intValue();
00353:                 for (int i4 = 0; i4 < this.zoneNum; i4++) {
00354:                     if ((iIntValue3 >> i4) % 2 == 0) {
00355:                         this.zoneBeans.get(i4).setWait(false);
00356:                     } else {
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800ManualPresenter.stopManual`

Статус: **полный метод**.

```java
00118:     public void stopManual(List<IicZoneBean> list) {
00119:         if (this.mDevice != null) {
00120:             StringBuilder sb = new StringBuilder();
00121:             StringBuilder sb2 = new StringBuilder();
00122:             boolean z = false;
00123:             int i2 = 0;
00124:             for (IicZoneBean iicZoneBean : list) {
00125:                 int manualMode = iicZoneBean.getManualMode();
00126:                 if (iicZoneBean.isWateringSwitch()) {
00127:                     sb.append(StringUtils.intToHex(0, 4));
00128:                     sb2.append(StringUtils.intToHex(0, 4));
00129:                     z = true;
00130:                 } else {
00131:                     sb.append(StringUtils.intToHex(iicZoneBean.getRemainTime(), 4));
00132:                     sb2.append(StringUtils.intToHex(iicZoneBean.getWateredTime(), 4));
00133:                 }
00134:                 i2 = manualMode;
00135:             }
00136:             if (z) {
00137:                 ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00138:                 DeviceUtils.sendCommand("45", "01" + StringUtils.intToHex(i2, 2) + ((Object) sb) + ((Object) sb2), this.mDevice, this.resultCallback);
00139:             }
00140:         }
00141:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800ManualPresenter.stopAllManual`

Статус: **полный метод**.

```java
00143:     public void stopAllManual() {
00144:         if (this.mDevice != null) {
00145:             ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00146:             if (Iic800Constant.devType.equals(Iic800Constant.IIC_400)) {
00147:                 DeviceUtils.sendCommand("45", "010000000000000000000000000000000000", this.mDevice, this.resultCallback);
00148:             } else if (Iic800Constant.devType.equals(Iic800Constant.IIC_600)) {
00149:                 DeviceUtils.sendCommand("45", "0100000000000000000000000000000000000000000000000000", this.mDevice, this.resultCallback);
00150:             } else {
00151:                 DeviceUtils.sendCommand("45", "01000000000000000000000000000000000000000000000000000000000000000000", this.mDevice, this.resultCallback);
00152:             }
00153:         }
00154:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800ManualPresenter.startManuals`

Статус: **полный метод**.

```java
00156:     public void startManuals(List<IicZoneBean> list) {
00157:         if (this.mDevice != null) {
00158:             if (!getPowerStatus()) {
00159:                 PopWindowUtil.getInstance().showTips(ActivityManager.getAppManager().currentActivity(), this.mContext.getString(R.string.normal_tip), this.mContext.getString(R.string.msg_power_switch));
00160:                 return;
00161:             }
00162:             StringBuilder sb = new StringBuilder();
00163:             StringBuilder sb2 = new StringBuilder();
00164:             for (IicZoneBean iicZoneBean : list) {
00165:                 sb.append(StringUtils.intToHex(iicZoneBean.getManualTime(), 4));
00166:                 sb2.append(StringUtils.intToHex(iicZoneBean.getWateredTime(), 4));
00167:             }
00168:             ProgressUtils.showLoadingViewFullPage(this.mContext.requireContext());
00169:             DeviceUtils.sendCommand("45", "0101" + ((Object) sb) + ((Object) sb2), this.mDevice, this.resultCallback);
00170:             Log.i("45dp:", "-------0101" + ((Object) sb) + ((Object) sb2));
00171:         }
00172:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800ManualPresenter.startManuals2`

Статус: **полный метод**.

```java
00174:     public void startManuals2(List<IicZoneBean> list) {
00175:         if (this.mDevice != null) {
00176:             StringBuilder sb = new StringBuilder();
00177:             StringBuilder sb2 = new StringBuilder();
00178:             for (int i2 = 1; i2 < 9; i2++) {
00179:                 Iterator<IicZoneBean> it = list.iterator();
00180:                 while (true) {
00181:                     if (it.hasNext()) {
00182:                         IicZoneBean next = it.next();
00183:                         if (next.getZoneId() == i2) {
00184:                             sb.append(StringUtils.intToHex(next.getManualTime(), 4));
00185:                             sb2.append(StringUtils.intToHex(next.getWateredTime(), 4));
00186:                             break;
00187:                         }
00188:                     } else {
00189:                         sb.append(StringUtils.intToHex(0, 4));
00190:                         sb2.append(StringUtils.intToHex(0, 4));
00191:                         break;
00192:                     }
00193:                 }
00194:             }
00195:             ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00196:             DeviceUtils.sendCommand("45", "0101" + ((Object) sb) + ((Object) sb2), this.mDevice, this.resultCallback);
00197:         }
00198:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800ManualPresenter.changeManuals`

Статус: **полный метод**.

```java
00200:     public void changeManuals(List<IicZoneBean> list) {
00201:         if (this.mDevice != null) {
00202:             StringBuilder sb = new StringBuilder();
00203:             StringBuilder sb2 = new StringBuilder();
00204:             for (IicZoneBean iicZoneBean : list) {
00205:                 sb.append(StringUtils.intToHex(iicZoneBean.getManualTime(), 4));
00206:                 sb2.append(StringUtils.intToHex(iicZoneBean.getWateredTime(), 4));
00207:             }
00208:             ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00209:             DeviceUtils.sendCommand("45", "0201" + ((Object) sb) + ((Object) sb2), this.mDevice, this.resultCallback);
00210:         }
00211:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800ManualPresenter.startAllManual`

Статус: **полный метод**.

```java
00213:     public void startAllManual(int i2) {
00214:         if (this.mDevice == null || i2 <= 0) {
00215:             return;
00216:         }
00217:         StringBuilder sb = new StringBuilder();
00218:         StringBuilder sb2 = new StringBuilder();
00219:         for (int i3 = 0; i3 < 8; i3++) {
00220:             sb.append(StringUtils.intToHex(i2, 4));
00221:             sb2.append(StringUtils.intToHex(0, 4));
00222:         }
00223:         ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00224:         DeviceUtils.sendCommand("45", "0100" + ((Object) sb) + ((Object) sb2), this.mDevice, this.resultCallback);
00225:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800ManualPresenter.changeAllManual`

Статус: **полный метод**.

```java
00227:     public void changeAllManual(List<IicZoneBean> list, int i2) {
00228:         if (this.mDevice != null) {
00229:             StringBuilder sb = new StringBuilder();
00230:             StringBuilder sb2 = new StringBuilder();
00231:             for (IicZoneBean iicZoneBean : list) {
00232:                 if (iicZoneBean.isWateringSwitch()) {
00233:                     sb.append(StringUtils.intToHex(i2, 4));
00234:                 } else {
00235:                     sb.append(StringUtils.intToHex(iicZoneBean.getRemainTime(), 4));
00236:                 }
00237:                 sb2.append(StringUtils.intToHex(iicZoneBean.getWateredTime(), 4));
00238:             }
00239:             ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00240:             DeviceUtils.sendCommand("45", "0200" + ((Object) sb) + ((Object) sb2), this.mDevice, this.resultCallback);
00241:         }
00242:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800ManualPresenter.getPowerStatus`

Статус: **полный метод**.

```java
00327:     public boolean getPowerStatus() {
00328:         DeviceBean deviceBean = ThingHomeSdk.getDataInstance().getDeviceBean(this.devId);
00329:         if (deviceBean == null || deviceBean.getDps() == null) {
00330:             return false;
00331:         }
00332:         Object obj = deviceBean.getDps().get("101");
00333:         return !"OFF".equals(obj != null ? obj.toString() : "OFF");
00334:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SchedulePresenter.startManuals`

Статус: **полный метод**.

```java
00085:     public void startManuals(List<IicZoneBean> list) {
00086:         if (this.mDevice != null) {
00087:             StringBuilder sb = new StringBuilder();
00088:             StringBuilder sb2 = new StringBuilder();
00089:             Iterator<IicZoneBean> it = list.iterator();
00090:             while (it.hasNext()) {
00091:                 sb.append(StringUtils.intToHex(it.next().getRemainTime(), 4));
00092:                 sb2.append(StringUtils.intToHex(0, 4));
00093:             }
00094:             ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00095:             DeviceUtils.sendCommand("45", "0201" + ((Object) sb) + ((Object) sb2), this.mDevice, this.resultCallback);
00096:         }
00097:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SchedulePresenter.stopManual`

Статус: **полный метод**.

```java
00099:     public void stopManual(List<IicZoneBean> list) {
00100:         if (this.mDevice != null) {
00101:             StringBuilder sb = new StringBuilder();
00102:             StringBuilder sb2 = new StringBuilder();
00103:             boolean z = false;
00104:             for (IicZoneBean iicZoneBean : list) {
00105:                 if (iicZoneBean.isWateringSwitch()) {
00106:                     sb.append(StringUtils.intToHex(0, 4));
00107:                     sb2.append(StringUtils.intToHex(0, 4));
00108:                     z = true;
00109:                 } else {
00110:                     sb.append(StringUtils.intToHex(iicZoneBean.getRemainTime(), 4));
00111:                     sb2.append(StringUtils.intToHex(iicZoneBean.getWateredTime(), 4));
00112:                 }
00113:             }
00114:             if (z) {
00115:                 ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00116:                 DeviceUtils.sendCommand("45", "0201" + ((Object) sb) + ((Object) sb2), this.mDevice, this.resultCallback);
00117:             }
00118:         }
00119:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SchedulePresenter.setPlan`

Статус: **полный метод**.

```java
00121:     public void setPlan(IicZoneBean iicZoneBean) {
00122:         ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00123:         DeviceUtils.sendCommand("38", parseIICZoneBean(1 << (iicZoneBean.getZoneId() - 1), iicZoneBean), ThingHomeSdk.newDeviceInstance(this.devId), this.resultCallback);
00124:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SchedulePresenter.parseIICZoneBean`

Статус: **полный метод**.

```java
00126:     private String parseIICZoneBean(int i2, IicZoneBean iicZoneBean) {
00127:         StringBuilder sb = new StringBuilder(StringUtils.intToHex(i2, 2));
00128:         sb.append(StringUtils.intToHex(iicZoneBean.getRunTime(), 2));
00129:         for (int i3 = 0; i3 < 6; i3++) {
00130:             if (i3 < iicZoneBean.getStartTimeList().size()) {
00131:                 sb.append(StringUtils.intToHex(iicZoneBean.getStartTimeList().get(i3).getHour(), 2));
00132:             } else {
00133:                 sb.append("FF");
00134:             }
00135:         }
00136:         for (int i4 = 0; i4 < 6; i4++) {
00137:             if (i4 < iicZoneBean.getStartTimeList().size()) {
00138:                 sb.append(StringUtils.intToHex(iicZoneBean.getStartTimeList().get(i4).getMinute(), 2));
00139:             } else {
00140:                 sb.append("FF");
00141:             }
00142:         }
00143:         sb.append(StringUtils.intToHex(iicZoneBean.getScheduleMode(), 2));
00144:         sb.append(StringUtils.intToHex(iicZoneBean.getScheduleDay(), 2));
00145:         sb.append(StringUtils.intToHex(iicZoneBean.getIntervalYear(), 2));
00146:         sb.append(StringUtils.intToHex(iicZoneBean.getIntervalMonth(), 2));
00147:         sb.append(StringUtils.intToHex(iicZoneBean.getIntervalDay(), 2));
00148:         if (iicZoneBean.isEnable()) {
00149:             sb.append("1");
00150:         } else {
00151:             sb.append("0");
00152:         }
00153:         if (iicZoneBean.isSeaAdjSwitch()) {
00154:             sb.append("1");
00155:         } else {
00156:             sb.append("0");
00157:         }
00158:         return sb.toString();
00159:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SchedulePresenter.setScheduleTime`

Статус: **полный метод**.

```java
00161:     public void setScheduleTime(IicZoneBean iicZoneBean, int i2) {
00162:         StringBuilder sb = new StringBuilder(StringUtils.intToHex(1 << (iicZoneBean.getZoneId() - 1), 2));
00163:         sb.append(StringUtils.intToHex(i2, 2));
00164:         for (int i3 = 0; i3 < 6; i3++) {
00165:             if (i3 < iicZoneBean.getStartTimeList().size()) {
00166:                 sb.append(StringUtils.intToHex(iicZoneBean.getStartTimeList().get(i3).getHour(), 2));
00167:             } else {
00168:                 sb.append("FF");
00169:             }
00170:         }
00171:         for (int i4 = 0; i4 < 6; i4++) {
00172:             if (i4 < iicZoneBean.getStartTimeList().size()) {
00173:                 sb.append(StringUtils.intToHex(iicZoneBean.getStartTimeList().get(i4).getMinute(), 2));
00174:             } else {
00175:                 sb.append("FF");
00176:             }
00177:         }
00178:         sb.append(StringUtils.intToHex(iicZoneBean.getScheduleMode(), 2));
00179:         sb.append(StringUtils.intToHex(iicZoneBean.getScheduleDay(), 2));
00180:         sb.append(StringUtils.intToHex(iicZoneBean.getIntervalYear(), 2));
00181:         sb.append(StringUtils.intToHex(iicZoneBean.getIntervalMonth(), 2));
00182:         sb.append(StringUtils.intToHex(iicZoneBean.getIntervalDay(), 2));
00183:         if (iicZoneBean.isEnable()) {
00184:             sb.append("1");
00185:         } else {
00186:             sb.append("0");
00187:         }
00188:         if (iicZoneBean.isSeaAdjSwitch()) {
00189:             sb.append("1");
00190:         } else {
00191:             sb.append("0");
00192:         }
00193:         ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00194:         DeviceUtils.sendCommand("38", sb.toString(), this.mDevice, this.resultCallback);
00195:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800AddPlanPresenter.reset`

Статус: **полный метод**.

```java
00095:     public void reset() {
00096:         IicZoneBean iicZoneBean = this.iicZoneBean;
00097:         if (iicZoneBean != null && iicZoneBean.getRunTime() > 0) {
00098:             ProgressUtils.showLoadingViewFullPage(this.mContext);
00099:             DeviceUtils.sendCommand("38", StringUtils.intToHex(1 << (this.iicZoneBean.getZoneId() - 1), 2) + "00ffffffffffffffffffffffff007f15090101", ThingHomeSdk.newDeviceInstance(this.devId), this.resetCallback);
00100:         } else {
00101:             this.mContext.finish();
00102:         }
00103:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800AddPlanPresenter.setPlan`

Статус: **полный метод**.

```java
00105:     public void setPlan(IicZoneBean iicZoneBean) {
00106:         try {
00107:             ProgressUtils.showLoadingViewFullPage(this.mContext);
00108:         } catch (Exception e2) {
00109:             e2.printStackTrace();
00110:         }
00111:         if (this.iicZoneBean != null) {
00112:             if (iicZoneBean.getName() != null && !iicZoneBean.getName().equals("")) {
00113:                 SharedPreferences.Editor editorEdit = this.sharedPreferences.edit();
00114:                 editorEdit.putString(this.devId + iicZoneBean.getZoneId() + "name", iicZoneBean.getName());
00115:                 editorEdit.apply();
00116:             }
00117:             DeviceUtils.sendCommand("38", parseIICZoneBean(1 << (iicZoneBean.getZoneId() - 1), iicZoneBean), ThingHomeSdk.newDeviceInstance(this.devId), this.setCallback);
00118:             return;
00119:         }
00120:         List<ZoneNumber> list = this.zoneNumbers;
00121:         if (list == null || list.size() == 0) {
00122:             return;
00123:         }
00124:         Iterator<ZoneNumber> it = this.zoneNumbers.iterator();
00125:         int num = 0;
00126:         while (it.hasNext()) {
00127:             num += 1 << (it.next().getNum() - 1);
00128:         }
00129:         DeviceUtils.sendCommand("38", parseIICZoneBean(num, iicZoneBean), ThingHomeSdk.newDeviceInstance(this.devId), this.setCallback);
00130:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800AddPlanPresenter.parseIICZoneBean`

Статус: **полный метод**.

```java
00149:     private String parseIICZoneBean(int i2, IicZoneBean iicZoneBean) {
00150:         StringBuilder sb = new StringBuilder(StringUtils.intToHex(i2, 2));
00151:         sb.append(StringUtils.intToHex(iicZoneBean.getRunTime(), 2));
00152:         for (int i3 = 0; i3 < 6; i3++) {
00153:             if (i3 < iicZoneBean.getStartTimeList().size()) {
00154:                 sb.append(StringUtils.intToHex(iicZoneBean.getStartTimeList().get(i3).getHour(), 2));
00155:             } else {
00156:                 sb.append("FF");
00157:             }
00158:         }
00159:         for (int i4 = 0; i4 < 6; i4++) {
00160:             if (i4 < iicZoneBean.getStartTimeList().size()) {
00161:                 sb.append(StringUtils.intToHex(iicZoneBean.getStartTimeList().get(i4).getMinute(), 2));
00162:             } else {
00163:                 sb.append("FF");
00164:             }
00165:         }
00166:         sb.append(StringUtils.intToHex(iicZoneBean.getScheduleMode(), 2));
00167:         sb.append(StringUtils.intToHex(iicZoneBean.getScheduleDay(), 2));
00168:         sb.append(StringUtils.intToHex(iicZoneBean.getIntervalYear(), 2));
00169:         sb.append(StringUtils.intToHex(iicZoneBean.getIntervalMonth(), 2));
00170:         sb.append(StringUtils.intToHex(iicZoneBean.getIntervalDay(), 2));
00171:         if (iicZoneBean.isEnable()) {
00172:             sb.append("1");
00173:         } else {
00174:             sb.append("0");
00175:         }
00176:         if (iicZoneBean.isSeaAdjSwitch()) {
00177:             sb.append("1");
00178:         } else {
00179:             sb.append("0");
00180:         }
00181:         Log.i("我发的38", sb.toString());
00182:         return sb.toString();
00183:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SettingsPresenter.changeRainSensor`

Статус: **полный метод**.

```java
00094:     public void changeRainSensor() {
00095:         ProgressUtils.showLoadingViewFullPage(this.mContext);
00096:         DeviceBean deviceBean = ThingHomeSdk.getDataInstance().getDeviceBean(this.devId);
00097:         if (deviceBean != null) {
00098:             DeviceUtils.sendCommand("102", Boolean.valueOf(!this.mModel.getRainSenTotal(deviceBean)), this.mDevice, this.resultCallback);
00099:         }
00100:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SettingsPresenter.changeMainValve`

Статус: **полный метод**.

```java
00108:     public void changeMainValve() {
00109:         DeviceBean deviceBean = ThingHomeSdk.getDataInstance().getDeviceBean(this.devId);
00110:         if (deviceBean != null && this.mModel.getMainValue2(deviceBean)) {
00111:             showMainValueDialog();
00112:         } else {
00113:             ProgressUtils.showLoadingViewFullPage(this.mContext);
00114:             DeviceUtils.sendCommand("111", true, this.mDevice, this.resultCallback);
00115:         }
00116:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SettingsPresenter.changeSeaAdjValue`

Статус: **полный метод**.

```java
00118:     public void changeSeaAdjValue(int i2) {
00119:         Activity activity = this.mContext;
00120:         if (activity != null) {
00121:             ProgressUtils.showLoadingViewFullPage(activity);
00122:         }
00123:         DeviceUtils.sendCommand("103", Integer.valueOf(i2), this.mDevice, this.resultCallback);
00124:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SettingsPresenter.resetDevice`

Статус: **полный метод**.

```java
00133:     public void resetDevice() {
00134:         Activity activity = this.mContext;
00135:         SharedPreferences.Editor editorEdit = activity.getSharedPreferences(activity.getPackageName(), 0).edit();
00136:         for (int i2 = 1; i2 <= 8; i2++) {
00137:             editorEdit.putBoolean(this.devId + i2 + "SeaAdjSwitch", true);
00138:         }
00139:         editorEdit.apply();
00140:         Activity activity2 = this.mContext;
00141:         if (activity2 != null) {
00142:             ProgressUtils.showLoadingViewFullPage(activity2);
00143:         }
00144:         DeviceUtils.sendCommand("105", true, this.mDevice, this.resultCallback);
00145:     }
```

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SettingsPresenter.setPowerStatus`

Статус: **полный метод**.

```java
00147:     public void setPowerStatus() {
00148:         DeviceBean deviceBean = ThingHomeSdk.getDataInstance().getDeviceBean(this.devId);
00149:         if (deviceBean != null) {
00150:             if (this.mModel.getPowerStatus(deviceBean)) {
00151:                 DeviceUtils.sendCommand("101", "OFF", this.mDevice, this.resultCallback);
00152:             } else {
00153:                 DeviceUtils.sendCommand("101", "Auto", this.mDevice, this.resultCallback);
00154:             }
00155:         }
00156:     }
```
