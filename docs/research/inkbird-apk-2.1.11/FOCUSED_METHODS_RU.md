# Focused IIC-800 protocol methods

Extracted verbatim from APK_PROTOCOL_METHODS_RU.md.

## Iic800Model.parseZoneInfo

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

## Iic800Model.parseIICZoneBean

_Not found in extracted method report._

## Iic800ManualPresenter.stopManual

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

## Iic800ManualPresenter.stopAllManual

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

## Iic800ManualPresenter.startManuals

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

## Iic800ManualPresenter.changeManuals

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

## Iic800ManualPresenter.startAllManual

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

## Iic800ManualPresenter.changeAllManual

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

## Iic800SchedulePresenter.startManuals

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

## Iic800SchedulePresenter.stopManual

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

## Iic800SchedulePresenter.setPlan

### `com.inkbird.inkbirdapp.device.iic800.presenter.Iic800SchedulePresenter.setPlan`

Статус: **полный метод**.

```java
00121:     public void setPlan(IicZoneBean iicZoneBean) {
00122:         ProgressUtils.showLoadingViewFullPage(this.mContext.getContext());
00123:         DeviceUtils.sendCommand("38", parseIICZoneBean(1 << (iicZoneBean.getZoneId() - 1), iicZoneBean), ThingHomeSdk.newDeviceInstance(this.devId), this.resultCallback);
00124:     }
```

## Iic800SchedulePresenter.setScheduleTime

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

## Iic800AddPlanPresenter.reset

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

## Iic800AddPlanPresenter.setPlan

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

## Iic800SettingsPresenter.changeRainSensor

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

## Iic800SettingsPresenter.changeSeaAdjValue

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

## Iic800SettingsPresenter.setPowerStatus

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
