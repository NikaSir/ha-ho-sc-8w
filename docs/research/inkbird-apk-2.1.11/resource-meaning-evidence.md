# INKBIRD 2.1.11 — IIC-800 resource meaning evidence

> Focused decoded resources used to distinguish the zone rain-sensor flag from seasonal adjustment.

## Matching strings

| locale | resource | value | source |
|---|---|---|---|
| `values` | `dev_go_to_rain_sensor` | Go to enable the Rain sensor | `res/values/strings.xml` |
| `values` | `dev_text_connect_rain_sensor_disclaimer` | DISCLAIMER\nHiOazo is not affiliated with or authorized by other rain sensor providers. This article is for instructional and compatibility purposes only.\n\nHiOazo does not recommend 3rd-party sensors unless required by local code. Always enable weather intelligence to skip watering BEFORE rain; rain sensors only act AFTER rain. | `res/values/strings.xml` |
| `values` | `dev_text_connect_rain_sensor_tip1` | Rain sensor wires are usually labeled \"S\", wire it into the \"S\" and \"24-\"terminals if you are running a rain sensor. | `res/values/strings.xml` |
| `values` | `dev_text_connect_rain_sensor_tip2` | Please enable the rain sensor on the app if if you are running a rain sensor. | `res/values/strings.xml` |
| `values` | `dev_text_rain_delay` | Rain delay | `res/values/strings.xml` |
| `values` | `dev_text_rain_delay_reminder` | Rain delay is applied to rain sensor skip, and rain skip in the Weather Intelligence. | `res/values/strings.xml` |
| `values` | `dev_text_rain_delay_time` | Rain delay time | `res/values/strings.xml` |
| `values` | `dev_text_rain_sensor` | Rain sensor | `res/values/strings.xml` |
| `values` | `dev_text_rain_sensor_reminder` | Before activating the rain sensor, please connect it correctly. | `res/values/strings.xml` |
| `values` | `dev_text_rain_sensor_skip_toast` | Due to the rain sensor skip, in zones relevant to device %s, watering for the next %d hours starting on %s will be skipped. | `res/values/strings.xml` |
| `values` | `dev_text_rain_skip_grey` | Rain skip(in grey) is not available? Enable the rain skip,or enable the rain sensor if you have an external rain sensor wired. | `res/values/strings.xml` |
| `values` | `dev_text_seasonal_adjust` | Seasonal adjust | `res/values/strings.xml` |
| `values` | `dev_text_seasonal_adjust_skip` | Follow seasonal adjust | `res/values/strings.xml` |
| `values` | `dev_text_seasonal_adjust_toast` | Due to seasonal adjustment, the watering time for this zone has been changed from %s to %s. | `res/values/strings.xml` |
| `values` | `dev_text_wire_rain_sensor` | %s Rain Sensor | `res/values/strings.xml` |
| `values` | `dev_text_wireless_rain_sensor` | %s Wireless Rain Sensor | `res/values/strings.xml` |
| `values` | `iic800_obey_rain_sensor` | Obey or Ignore Rain Sensor？ | `res/values/strings.xml` |
| `values` | `iic800_rain_sensor` | Main Switch Of Rain Sensor | `res/values/strings.xml` |
| `values` | `iic800_rain_sensor_ignore` | Ignore | `res/values/strings.xml` |
| `values` | `iic800_rain_sensor_obey` | Obey | `res/values/strings.xml` |
| `values` | `iic800_rain_sensor_switch_tips` | The main switch of rain sensor has been turned off. | `res/values/strings.xml` |
| `values` | `iic800_seasonal_adjustment` | Seasonally Adjusted Value: %1$s minutes | `res/values/strings.xml` |
| `values` | `iic800_seasonal_adjustment_tips` | Seasonally Adjusted Value | `res/values/strings.xml` |
| `values` | `percentage_of_seasonally_adjusted_value` | Percentage of seasonally adjusted value | `res/values/strings.xml` |

## Matching layouts

### `res/layout/activity_iic600_setting.xml`

```xml
00045:                 android:layout_height="wrap_content"
00046:                 android:layout_margin="20dp">
00047:                 <TextView
00048:                     android:textSize="17sp"
00049:                     android:textColor="@color/main_text_color"
00050:                     android:gravity="left"
00051:                     android:layout_width="match_parent"
00052:                     android:layout_height="wrap_content"
00053:                     android:text="@string/iic800_rain_sensor"
00054:                     android:layout_centerVertical="true"
00055:                     android:layout_marginStart="10dp"
00056:                     android:layout_toStartOf="@+id/iic_setting_switch_rain_sensor"/>
00057:                 <ImageView
00058:                     android:id="@+id/iic_setting_switch_rain_sensor"
00059:                     android:layout_width="44dp"
00060:                     android:layout_height="23dp"
00061:                     android:src="@mipmap/iic_switch_on"
00062:                     android:layout_centerVertical="true"
00063:                     android:layout_marginStart="40dp"
00064:                     android:layout_marginEnd="10dp"
00065:                     android:layout_alignParentEnd="true"/>
00066:             </RelativeLayout>
```

```xml
00101:                 android:layout_marginEnd="20dp">
00102:                 <TextView
00103:                     android:textSize="17sp"
00104:                     android:textColor="@color/main_text_color"
00105:                     android:gravity="left"
00106:                     android:layout_width="wrap_content"
00107:                     android:layout_height="wrap_content"
00108:                     android:layout_margin="30dp"
00109:                     android:text="@string/iic800_seasonal_adjustment_tips"/>
00110:                 <TextView
00111:                     android:textSize="30sp"
00112:                     android:textColor="@color/iic800Color"
00113:                     android:gravity="center"
00114:                     android:layout_gravity="center_horizontal"
00115:                     android:id="@+id/tv_rain_number"
00116:                     android:background="@drawable/bg_iic_btn_5"
00117:                     android:paddingTop="10dp"
00118:                     android:paddingBottom="10dp"
00119:                     android:layout_width="132dp"
00120:                     android:layout_height="wrap_content"
00121:                     android:text="100%"
00122:                     android:paddingStart="20dp"
00123:                     android:paddingEnd="20dp"/>
```

### `res/layout/activity_iic800_add_plan.xml`

```xml
00086:                 android:layout_width="match_parent"
00087:                 android:layout_height="wrap_content">
00088:                 <include layout="@layout/layout_iic800_watering_period"/>
00089:                 <TextView
00090:                     android:textSize="20sp"
00091:                     android:textStyle="bold"
00092:                     android:textColor="@color/content_text_color"
00093:                     android:gravity="left"
00094:                     android:id="@+id/tv_rain_title"
00095:                     android:layout_width="wrap_content"
00096:                     android:layout_height="wrap_content"
00097:                     android:layout_marginTop="25dp"
00098:                     android:text="@string/iic800_obey_rain_sensor"/>
00099:                 <RadioGroup
00100:                     android:orientation="horizontal"
00101:                     android:id="@+id/rg_rain_sensor"
00102:                     android:layout_width="wrap_content"
00103:                     android:layout_height="wrap_content"
00104:                     android:layout_marginTop="20dp"
00105:                     android:checkedButton="@+id/rb_sensor_yes"
00106:                     android:layout_marginStart="8dp">
00107:                     <RadioButton
00108:                         android:textSize="15sp"
00109:                         android:textColor="@drawable/selector_iic800_radio_text"
00110:                         android:id="@+id/rb_sensor_yes"
00111:                         android:background="@drawable/selector_iic800_radio_button"
00112:                         android:padding="10dp"
00113:                         android:layout_width="wrap_content"
00114:                         android:layout_height="wrap_content"
00115:                         android:button="@null"
00116:                         android:text="@string/iic800_rain_sensor_obey"/>
00117:                     <RadioButton
00118:                         android:textSize="15sp"
00119:                         android:textColor="@drawable/selector_iic800_radio_text"
00120:                         android:id="@+id/rb_sensor_no"
00121:                         android:background="@drawable/selector_iic800_radio_button"
00122:                         android:padding="10dp"
00123:                         android:layout_width="wrap_content"
00124:                         android:layout_height="wrap_content"
00125:                         android:button="@null"
00126:                         android:text="@string/iic800_rain_sensor_ignore"
00127:                         android:layout_marginStart="17dp"/>
00128:                 </RadioGroup>
00129:                 <TextView
00130:                     android:textSize="20sp"
00131:                     android:textStyle="bold"
00132:                     android:textColor="@color/content_text_color"
00133:                     android:gravity="left"
00134:                     android:visibility="gone"
```

### `res/layout/activity_iic800_settings.xml`

```xml
00045:                 android:layout_height="wrap_content"
00046:                 android:layout_margin="20dp">
00047:                 <TextView
00048:                     android:textSize="17sp"
00049:                     android:textColor="@color/main_text_color"
00050:                     android:gravity="left"
00051:                     android:layout_width="match_parent"
00052:                     android:layout_height="wrap_content"
00053:                     android:text="@string/iic800_rain_sensor"
00054:                     android:layout_centerVertical="true"
00055:                     android:layout_marginStart="10dp"
00056:                     android:layout_toStartOf="@+id/iic_setting_switch_rain_sensor"/>
00057:                 <ImageView
00058:                     android:id="@+id/iic_setting_switch_rain_sensor"
00059:                     android:layout_width="44dp"
00060:                     android:layout_height="23dp"
00061:                     android:src="@mipmap/iic_switch_on"
00062:                     android:layout_centerVertical="true"
00063:                     android:layout_marginStart="40dp"
00064:                     android:layout_marginEnd="10dp"
00065:                     android:layout_alignParentEnd="true"/>
00066:             </RelativeLayout>
```

```xml
00103:                 android:layout_marginEnd="20dp">
00104:                 <TextView
00105:                     android:textSize="17sp"
00106:                     android:textColor="@color/main_text_color"
00107:                     android:gravity="left"
00108:                     android:layout_width="wrap_content"
00109:                     android:layout_height="wrap_content"
00110:                     android:layout_margin="30dp"
00111:                     android:text="@string/iic800_seasonal_adjustment_tips"/>
00112:                 <TextView
00113:                     android:textSize="30sp"
00114:                     android:textColor="@color/iic800Color"
00115:                     android:gravity="center"
00116:                     android:layout_gravity="center_horizontal"
00117:                     android:id="@+id/tv_rain_number"
00118:                     android:background="@drawable/bg_iic_btn_5"
00119:                     android:paddingTop="10dp"
00120:                     android:paddingBottom="10dp"
00121:                     android:layout_width="132dp"
00122:                     android:layout_height="wrap_content"
00123:                     android:text="100%"
00124:                     android:paddingStart="20dp"
00125:                     android:paddingEnd="20dp"/>
```

### `res/layout/activity_instruction_dev.xml`

```xml
00185:                     android:layout_width="wrap_content"
00186:                     android:layout_height="wrap_content"
00187:                     android:text="@string/Alexa_turn_off_device"
00188:                     android:layout_toStartOf="@+id/power_uImg_3"/>
00189:             </RelativeLayout>
00190:         </LinearLayout>
00191:         <LinearLayout
00192:             android:orientation="vertical"
00193:             android:id="@+id/seasonLayout"
00194:             android:background="@drawable/bg_person_tab_item"
00195:             android:padding="15dp"
00196:             android:visibility="gone"
00197:             android:layout_width="match_parent"
00198:             android:layout_height="wrap_content"
00199:             android:layout_marginTop="10dp"
00200:             android:layout_marginStart="14dp"
00201:             android:layout_marginEnd="14dp">
00202:             <RelativeLayout
00203:                 android:id="@+id/seasonTalk1"
00204:                 android:layout_width="match_parent"
00205:                 android:layout_height="wrap_content">
00206:                 <ImageView
00207:                     android:id="@+id/season_uImg_1"
00208:                     android:layout_width="40dp"
00209:                     android:layout_height="40dp"
00210:                     android:src="@mipmap/icon_alexa"
00211:                     android:layout_centerVertical="true"/>
00212:                 <TextView
00213:                     android:textSize="17sp"
00214:                     android:textColor="@color/normalBlack"
00215:                     android:gravity="left"
00216:                     android:background="@mipmap/bg_alexa_pop"
00217:                     android:padding="15dp"
00218:                     android:layout_width="wrap_content"
00219:                     android:layout_height="wrap_content"
00220:                     android:text="@string/percentage_of_seasonally_adjusted_value"
00221:                     android:layout_toEndOf="@+id/season_uImg_1"/>
00222:             </RelativeLayout>
00223:             <RelativeLayout
00224:                 android:id="@+id/seasonTalk2"
00225:                 android:layout_width="match_parent"
00226:                 android:layout_height="wrap_content"
00227:                 android:layout_marginTop="10dp">
00228:                 <ImageView
00229:                     android:id="@+id/season_uImg_2"
00230:                     android:layout_width="40dp"
00231:                     android:layout_height="40dp"
00232:                     android:src="@mipmap/icon_user_img"
00233:                     android:layout_centerVertical="true"
00234:                     android:layout_alignParentEnd="true"/>
00235:                 <TextView
00236:                     android:textSize="17sp"
00237:                     android:textColor="@color/normalWhite"
00238:                     android:gravity="left"
00239:                     android:background="@mipmap/bg_user_pop"
00240:                     android:padding="15dp"
00241:                     android:layout_width="wrap_content"
00242:                     android:layout_height="wrap_content"
00243:                     android:text="@string/Alexa_set_the_device_to_thirty_percent"
00244:                     android:layout_toStartOf="@+id/season_uImg_2"/>
00245:             </RelativeLayout>
00246:             <RelativeLayout
00247:                 android:id="@+id/seasonTalk4"
00248:                 android:layout_width="match_parent"
00249:                 android:layout_height="wrap_content"
00250:                 android:layout_marginTop="10dp">
00251:                 <ImageView
00252:                     android:id="@+id/season_uImg_4"
00253:                     android:layout_width="40dp"
00254:                     android:layout_height="40dp"
00255:                     android:src="@mipmap/icon_user_img"
00256:                     android:layout_centerVertical="true"
00257:                     android:layout_alignParentEnd="true"/>
00258:                 <TextView
00259:                     android:textSize="17sp"
00260:                     android:textColor="@color/normalWhite"
00261:                     android:gravity="left"
00262:                     android:background="@mipmap/bg_user_pop"
00263:                     android:padding="15dp"
00264:                     android:layout_width="wrap_content"
00265:                     android:layout_height="wrap_content"
00266:                     android:text="@string/Alexa_decrease_device_by_twenty_percent"
00267:                     android:layout_toStartOf="@+id/season_uImg_4"/>
00268:             </RelativeLayout>
00269:             <RelativeLayout
00270:                 android:id="@+id/seasonTalk3"
00271:                 android:layout_width="match_parent"
00272:                 android:layout_height="wrap_content"
00273:                 android:layout_marginTop="10dp">
00274:                 <ImageView
00275:                     android:id="@+id/season_uImg_3"
00276:                     android:layout_width="40dp"
00277:                     android:layout_height="40dp"
00278:                     android:src="@mipmap/icon_user_img"
00279:                     android:layout_centerVertical="true"
00280:                     android:layout_alignParentEnd="true"/>
00281:                 <TextView
00282:                     android:textSize="17sp"
00283:                     android:textColor="@color/normalWhite"
00284:                     android:gravity="left"
00285:                     android:background="@mipmap/bg_user_pop"
00286:                     android:padding="15dp"
00287:                     android:layout_width="wrap_content"
00288:                     android:layout_height="wrap_content"
00289:                     android:text="@string/Alexa_increase_device_by_ten_percent"
00290:                     android:layout_toStartOf="@+id/season_uImg_3"/>
00291:             </RelativeLayout>
00292:         </LinearLayout>
00293:     </LinearLayout>
00294: </ScrollView>
```

### `res/layout/dev_activity_delay_zone.xml`

```xml
00101:             android:textSize="14sp"
00102:             android:textColor="@color/dev_color_666666"
00103:             android:gravity="center"
00104:             android:layout_gravity="center"
00105:             android:id="@+id/delay_tv"
00106:             android:layout_width="match_parent"
00107:             android:layout_height="wrap_content"
00108:             android:layout_margin="30dp"
00109:             android:text="@string/dev_text_seasonal_adjust_txt"
00110:             binding:bright="@color/dev_color_666666"
00111:             binding:dark="@color/dev_color_999999"/>
00112:     </LinearLayout>
00113: </me.goldze.mvvmhabit.widget.widget.NightLinearLayout>
```

### `res/layout/dev_activity_device_details.xml`

```xml
00029:             android:textSize="17sp"
00030:             android:id="@+id/title_tv"
00031:             android:layout_width="wrap_content"
00032:             android:layout_height="wrap_content"
00033:             android:layout_marginTop="2dp"
00034:             android:text="@string/dev_text_device_details"
00035:             android:layout_centerHorizontal="true"/>
00036:         <me.goldze.mvvmhabit.widget.widget.NightToggleButton
00037:             android:id="@+id/rain_tb"
00038:             android:background="@drawable/dev_selector_switch_btn"
00039:             android:layout_width="45dp"
00040:             android:layout_height="20dp"
00041:             android:layout_marginTop="8dp"
00042:             android:layout_marginRight="20dp"
00043:             android:checked="true"
00044:             android:textOn=""
00045:             android:textOff=""
00046:             android:layout_alignParentRight="true"/>
00047:         <LinearLayout
00048:             android:id="@+id/turn_off_ll"
00049:             android:background="@mipmap/dev_bg_turn_off"
00050:             android:layout_width="match_parent"
00051:             android:layout_height="wrap_content"
00052:             android:layout_marginLeft="12dp"
00053:             android:layout_marginTop="8dp"
00054:             android:layout_marginRight="12dp"
00055:             android:layout_below="@+id/rain_tb">
00056:             <me.goldze.mvvmhabit.widget.widget.NightTextView
00057:                 android:gravity="center_vertical"
00058:                 android:layout_width="match_parent"
00059:                 android:layout_height="wrap_content"
00060:                 android:layout_marginLeft="16dp"
00061:                 android:layout_marginTop="18dp"
00062:                 android:text="@string/dev_text_device_turn_on_toast"/>
00063:         </LinearLayout>
```

```xml
00069:         android:layout_height="wrap_content"
00070:         android:layout_marginTop="18dp"
00071:         android:layout_marginBottom="90dp"
00072:         android:layout_below="@+id/title_rl">
00073:         <LinearLayout
00074:             android:orientation="vertical"
00075:             android:layout_width="match_parent"
00076:             android:layout_height="wrap_content">
00077:             <androidx.constraintlayout.widget.ConstraintLayout
00078:                 android:id="@+id/dev_abnormal_cl"
00079:                 android:visibility="gone"
00080:                 android:layout_width="match_parent"
00081:                 android:layout_height="wrap_content"
00082:                 android:layout_marginBottom="20dp">
00083:                 <ImageView
00084:                     android:id="@+id/msg_type_iv2"
00085:                     android:layout_width="wrap_content"
00086:                     android:layout_height="wrap_content"
00087:                     android:layout_marginLeft="12dp"
00088:                     android:src="@mipmap/dev_ic_abnormal"
00089:                     binding:layout_constraintLeft_toLeftOf="parent"
00090:                     binding:layout_constraintTop_toTopOf="parent"/>
00091:                 <TextView
00092:                     android:textSize="14sp"
00093:                     android:textColor="@color/dev_color_ac6440"
00094:                     android:id="@+id/abnormal_tv"
00095:                     android:layout_width="match_parent"
00096:                     android:layout_height="wrap_content"
00097:                     android:layout_marginLeft="60dp"
00098:                     android:layout_marginRight="23dp"
00099:                     binding:layout_constraintTop_toTopOf="parent"/>
00100:             </androidx.constraintlayout.widget.ConstraintLayout>
00101:             <LinearLayout
00102:                 android:id="@+id/dev_offline_ll"
00103:                 android:visibility="gone"
00104:                 android:layout_width="match_parent"
00105:                 android:layout_height="wrap_content"
00106:                 android:layout_marginBottom="20dp">
00107:                 <ImageView
00108:                     android:layout_width="wrap_content"
```

```xml
00218:                     android:tag="binding_4"
00219:                     android:layout_width="match_parent"
00220:                     android:layout_height="52dp">
00221:                     <ImageView
00222:                         android:id="@+id/device_iv3"
00223:                         android:layout_width="30dp"
00224:                         android:layout_height="30dp"
00225:                         android:layout_marginLeft="12dp"
00226:                         android:src="@mipmap/dev_ic_rain"
00227:                         android:layout_centerVertical="true"/>
00228:                     <me.goldze.mvvmhabit.widget.widget.NightTextView
00229:                         android:textSize="15sp"
00230:                         android:textColor="@color/dev_color_1A1A1A"
00231:                         android:layout_width="wrap_content"
00232:                         android:layout_height="wrap_content"
00233:                         android:layout_marginLeft="13dp"
00234:                         android:text="@string/dev_text_rain_delay"
00235:                         android:layout_toRightOf="@+id/device_iv3"
00236:                         android:layout_centerVertical="true"/>
00237:                     <me.goldze.mvvmhabit.widget.widget.NightTextView
00238:                         android:textSize="15sp"
00239:                         android:textColor="@color/dev_color_999999"
00240:                         android:id="@+id/rain_delay_tv"
00241:                         android:layout_width="wrap_content"
00242:                         android:layout_height="wrap_content"
00243:                         android:layout_marginRight="10dp"
00244:                         android:text="24H"
00245:                         android:layout_toLeftOf="@+id/hour_flow_iv"
00246:                         android:layout_centerVertical="true"
00247:                         binding:bright="@color/dev_color_999999"
00248:                         binding:dark="@color/dev_color_666666"/>
```

```xml
00266:                     android:tag="binding_5"
00267:                     android:layout_width="match_parent"
00268:                     android:layout_height="52dp">
00269:                     <ImageView
00270:                         android:id="@+id/device_iv4"
00271:                         android:layout_width="30dp"
00272:                         android:layout_height="30dp"
00273:                         android:layout_marginLeft="12dp"
00274:                         android:src="@mipmap/dev_ic_rain_sensor"
00275:                         android:layout_centerVertical="true"/>
00276:                     <me.goldze.mvvmhabit.widget.widget.NightTextView
00277:                         android:textSize="15sp"
00278:                         android:textColor="@color/dev_color_1A1A1A"
00279:                         android:layout_width="wrap_content"
00280:                         android:layout_height="wrap_content"
00281:                         android:layout_marginLeft="13dp"
00282:                         android:text="@string/dev_text_rain_sensor"
00283:                         android:layout_toRightOf="@+id/device_iv4"
00284:                         android:layout_centerVertical="true"/>
00285:                     <me.goldze.mvvmhabit.widget.widget.NightImageView2
00286:                         android:layout_width="wrap_content"
00287:                         android:layout_height="wrap_content"
00288:                         android:layout_marginRight="12dp"
00289:                         android:src="@mipmap/dev_ic_go_right"
00290:                         android:layout_alignParentRight="true"
```

```xml
00301:                     android:tag="binding_6"
00302:                     android:layout_width="match_parent"
00303:                     android:layout_height="52dp">
00304:                     <ImageView
00305:                         android:id="@+id/device_iv5"
00306:                         android:layout_width="wrap_content"
00307:                         android:layout_height="wrap_content"
00308:                         android:layout_marginLeft="12dp"
00309:                         android:src="@mipmap/dev_ic_seasonal_adjust"
00310:                         android:layout_centerVertical="true"/>
00311:                     <me.goldze.mvvmhabit.widget.widget.NightTextView
00312:                         android:textSize="15sp"
00313:                         android:textColor="@color/dev_color_1A1A1A"
00314:                         android:layout_width="wrap_content"
00315:                         android:layout_height="wrap_content"
00316:                         android:layout_marginLeft="13dp"
00317:                         android:text="@string/dev_text_seasonal_adjust"
00318:                         android:layout_toRightOf="@+id/device_iv5"
00319:                         android:layout_centerVertical="true"/>
00320:                     <me.goldze.mvvmhabit.widget.widget.NightImageView2
00321:                         android:layout_width="wrap_content"
00322:                         android:layout_height="wrap_content"
00323:                         android:layout_marginRight="12dp"
00324:                         android:src="@mipmap/dev_ic_go_right"
00325:                         android:layout_alignParentRight="true"
```

### `res/layout/dev_activity_schedule_details.xml`

```xml
00272:                     android:layout_width="wrap_content"
00273:                     android:layout_height="wrap_content"
00274:                     android:text="@string/dev_text_weather_intelligence_skips"
00275:                     binding:bright="@color/dev_color_666666"
00276:                     binding:dark="@color/dev_color_999999"/>
00277:             </RelativeLayout>
00278:             <LinearLayout
00279:                 android:gravity="center_vertical"
00280:                 android:id="@+id/rain_ll"
00281:                 android:layout_width="match_parent"
00282:                 android:layout_height="45dp">
00283:                 <ImageView
00284:                     android:id="@+id/rain_skip_iv"
00285:                     android:layout_width="wrap_content"
00286:                     android:layout_height="wrap_content"
00287:                     android:src="@mipmap/dev_ic_rain"/>
00288:                 <me.goldze.mvvmhabit.widget.widget.NightTextView
00289:                     android:textSize="20sp"
00290:                     android:textStyle="bold"
00291:                     android:id="@+id/rain_skip_tv"
00292:                     android:layout_width="wrap_content"
00293:                     android:layout_height="wrap_content"
00294:                     android:layout_marginLeft="15dp"
00295:                     android:text="@string/dev_text_rain_skip"/>
00296:                 <ImageView
00297:                     android:id="@+id/rain_tip_iv"
00298:                     android:visibility="gone"
00299:                     android:layout_width="22dp"
00300:                     android:layout_height="22dp"
00301:                     android:layout_marginLeft="2dp"
00302:                     android:src="@mipmap/dev_ic_tip"/>
00303:             </LinearLayout>
00304:             <LinearLayout
00305:                 android:gravity="center_vertical"
```

```xml
00349:                     android:id="@+id/wind_tip_iv"
00350:                     android:visibility="gone"
00351:                     android:layout_width="22dp"
00352:                     android:layout_height="22dp"
00353:                     android:layout_marginLeft="2dp"
00354:                     android:src="@mipmap/dev_ic_tip"/>
00355:             </LinearLayout>
00356:             <LinearLayout
00357:                 android:id="@+id/seasonal_adjust_ll"
00358:                 android:layout_width="match_parent"
00359:                 android:layout_height="wrap_content"
00360:                 android:layout_marginTop="10dp">
00361:                 <ImageView
00362:                     android:id="@+id/seasonal_adjust_iv"
00363:                     android:layout_width="wrap_content"
00364:                     android:layout_height="wrap_content"
00365:                     android:src="@mipmap/dev_ic_seasonal_adjust"/>
00366:                 <me.goldze.mvvmhabit.widget.widget.NightTextView
00367:                     android:textSize="20sp"
00368:                     android:textStyle="bold"
00369:                     android:layout_gravity="bottom"
00370:                     android:id="@+id/seasonal_adjust_tv"
00371:                     android:layout_width="wrap_content"
00372:                     android:layout_height="wrap_content"
00373:                     android:layout_marginLeft="15dp"
00374:                     android:text="@string/dev_text_seasonal_adjust_skip"/>
00375:             </LinearLayout>
00376:             <me.goldze.mvvmhabit.widget.widget.NightLinearLayout
00377:                 android:layout_width="match_parent"
00378:                 android:layout_height="1dp"/>
00379:             <RelativeLayout
00380:                 android:layout_width="match_parent"
00381:                 android:layout_height="wrap_content"
00382:                 android:layout_marginTop="20dp">
```

### `res/layout/dev_activity_schedule_details2.xml`

```xml
00019:         <me.goldze.mvvmhabit.widget.widget.NightTextView
00020:             android:textSize="17sp"
00021:             android:layout_width="wrap_content"
00022:             android:layout_height="wrap_content"
00023:             android:layout_marginTop="2dp"
00024:             android:text="@string/dev_text_schedule_details"
00025:             android:layout_centerHorizontal="true"/>
00026:         <me.goldze.mvvmhabit.widget.widget.NightToggleButton
00027:             android:id="@+id/rain_tb"
00028:             android:background="@drawable/dev_selector_switch_btn"
00029:             android:layout_width="45dp"
00030:             android:layout_height="20dp"
00031:             android:layout_marginTop="8dp"
00032:             android:layout_marginRight="20dp"
00033:             android:checked="true"
00034:             android:textOn=""
00035:             android:textOff=""
00036:             android:layout_alignParentRight="true"/>
00037:         <LinearLayout
00038:             android:id="@+id/turn_off_ll"
00039:             android:background="@mipmap/dev_bg_turn_off"
00040:             android:layout_width="match_parent"
00041:             android:layout_height="wrap_content"
00042:             android:layout_marginLeft="12dp"
00043:             android:layout_marginTop="8dp"
00044:             android:layout_marginRight="12dp"
00045:             android:layout_below="@+id/rain_tb">
00046:             <me.goldze.mvvmhabit.widget.widget.NightTextView
00047:                 android:gravity="center_vertical"
00048:                 android:layout_width="match_parent"
00049:                 android:layout_height="wrap_content"
00050:                 android:layout_marginLeft="16dp"
00051:                 android:layout_marginTop="18dp"
00052:                 android:text="@string/dev_text_schedule_turn_on_toast"/>
00053:         </LinearLayout>
```

```xml
00310:                 <me.goldze.mvvmhabit.widget.widget.NightImageView2
00311:                     android:layout_width="wrap_content"
00312:                     android:layout_height="wrap_content"
00313:                     android:src="@mipmap/dev_ic_go_right"
00314:                     android:layout_alignParentRight="true"
00315:                     app:dark="@color/dev_color_4D4D4D"/>
00316:             </RelativeLayout>
00317:             <LinearLayout
00318:                 android:id="@+id/rain_ll"
00319:                 android:layout_width="match_parent"
00320:                 android:layout_height="wrap_content"
00321:                 android:layout_marginTop="10dp">
00322:                 <ImageView
00323:                     android:id="@+id/rain_skip_iv"
00324:                     android:layout_width="wrap_content"
00325:                     android:layout_height="wrap_content"
00326:                     android:src="@mipmap/dev_ic_rain"/>
00327:                 <me.goldze.mvvmhabit.widget.widget.NightTextView
00328:                     android:textSize="20sp"
00329:                     android:textStyle="bold"
00330:                     android:layout_gravity="bottom"
00331:                     android:id="@+id/rain_skip_tv"
00332:                     android:layout_width="wrap_content"
00333:                     android:layout_height="wrap_content"
00334:                     android:layout_marginLeft="15dp"
00335:                     android:text="@string/dev_text_rain_skip"/>
00336:                 <ImageView
00337:                     android:layout_gravity="bottom"
00338:                     android:id="@+id/rain_tip_iv"
00339:                     android:layout_width="22dp"
00340:                     android:layout_height="22dp"
00341:                     android:layout_marginLeft="2dp"
00342:                     android:layout_marginBottom="1dp"
00343:                     android:src="@mipmap/dev_ic_tip"/>
00344:             </LinearLayout>
00345:             <LinearLayout
00346:                 android:id="@+id/skip_ll"
```

```xml
00394:                     android:id="@+id/wind_tip_iv"
00395:                     android:layout_width="22dp"
00396:                     android:layout_height="22dp"
00397:                     android:layout_marginLeft="2dp"
00398:                     android:layout_marginBottom="1dp"
00399:                     android:src="@mipmap/dev_ic_tip"/>
00400:             </LinearLayout>
00401:             <LinearLayout
00402:                 android:id="@+id/seasonal_adjust_ll"
00403:                 android:layout_width="match_parent"
00404:                 android:layout_height="wrap_content"
00405:                 android:layout_marginTop="10dp">
00406:                 <ImageView
00407:                     android:id="@+id/seasonal_adjust_iv"
00408:                     android:layout_width="wrap_content"
00409:                     android:layout_height="wrap_content"
00410:                     android:src="@mipmap/dev_ic_seasonal_adjust"/>
00411:                 <me.goldze.mvvmhabit.widget.widget.NightTextView
00412:                     android:textSize="20sp"
00413:                     android:textStyle="bold"
00414:                     android:layout_gravity="bottom"
00415:                     android:id="@+id/seasonal_adjust_tv"
00416:                     android:layout_width="wrap_content"
00417:                     android:layout_height="wrap_content"
00418:                     android:layout_marginLeft="15dp"
00419:                     android:text="@string/dev_text_seasonal_adjust_skip"/>
00420:             </LinearLayout>
00421:             <me.goldze.mvvmhabit.widget.widget.NightLinearLayout
00422:                 android:layout_width="match_parent"
00423:                 android:layout_height="1dp"
00424:                 android:layout_marginTop="12dp"/>
00425:             <RelativeLayout
00426:                 android:tag="binding_7"
00427:                 android:layout_width="match_parent"
```

### `res/layout/dev_activity_seasonal_adjust.xml`

```xml
00001: <?xml version="1.0" encoding="utf-8"?>
00002: <me.goldze.mvvmhabit.widget.widget.NightLinearLayout xmlns:android="http://schemas.android.com/apk/res/android" xmlns:binding="http://schemas.android.com/apk/res-auto"
00003:     android:orientation="vertical"
00004:     android:tag="layout/dev_activity_seasonal_adjust_0"
00005:     android:layout_width="match_parent"
00006:     android:layout_height="match_parent"
00007:     binding:bright="@color/white">
00008:     <RelativeLayout
00009:         android:id="@+id/title_rl"
00010:         android:layout_width="match_parent"
00011:         android:layout_height="wrap_content"
00012:         android:layout_marginTop="14dp">
00013:         <me.goldze.mvvmhabit.widget.widget.NightImageView
00014:             android:tag="binding_1"
00015:             android:paddingLeft="17dp"
00016:             android:layout_width="wrap_content"
00017:             android:layout_height="wrap_content"
00018:             android:src="@mipmap/dev_ic_back"/>
00019:         <me.goldze.mvvmhabit.widget.widget.NightTextView
00020:             android:textSize="17sp"
00021:             android:layout_width="wrap_content"
00022:             android:layout_height="wrap_content"
00023:             android:text="@string/dev_text_seasonal_adjust"
00024:             android:layout_centerInParent="true"/>
00025:     </RelativeLayout>
00026:     <me.goldze.mvvmhabit.widget.widget.NightTextView
00027:         android:textSize="14sp"
00028:         android:layout_width="match_parent"
00029:         android:layout_height="wrap_content"
00030:         android:layout_marginLeft="38dp"
00031:         android:layout_marginTop="30dp"
00032:         android:text="@string/dev_text_seasonal_adjust_txt"/>
00033:     <me.goldze.mvvmhabit.widget.widget.NightLinearLayoutRadius
00034:         android:gravity="center"
00035:         android:layout_width="128dp"
00036:         android:layout_height="48dp"
00037:         android:layout_marginLeft="38dp"
00038:         android:layout_marginTop="20dp"
00039:         binding:bright="@drawable/bg_item_bright_f5f5f5"
00040:         binding:dark="@drawable/bg_textview_dark">
```

```xml
00070:     <me.goldze.mvvmhabit.widget.widget.NightTextView
00071:         android:textSize="12sp"
00072:         android:textColor="@color/dev_color_666666"
00073:         android:layout_width="wrap_content"
00074:         android:layout_height="wrap_content"
00075:         android:layout_marginLeft="38dp"
00076:         android:layout_marginTop="20dp"
00077:         android:layout_marginRight="38dp"
00078:         android:text="@string/dev_text_seasonal_adjust_reminder"
00079:         binding:bright="@color/dev_color_666666"
00080:         binding:dark="@color/dev_color_999999"/>
00081: </me.goldze.mvvmhabit.widget.widget.NightLinearLayout>
```

### `res/layout/dev_fragment_weather_skip.xml`

```xml
00063:                 android:layout_width="match_parent"
00064:                 android:layout_height="54dp"
00065:                 android:layout_marginTop="13dp">
00066:                 <ImageView
00067:                     android:id="@+id/plan_iv"
00068:                     android:layout_width="wrap_content"
00069:                     android:layout_height="wrap_content"
00070:                     android:layout_marginLeft="15dp"
00071:                     android:src="@mipmap/dev_ic_rain"
00072:                     android:layout_centerVertical="true"/>
00073:                 <me.goldze.mvvmhabit.widget.widget.NightTextView
00074:                     android:textSize="15sp"
00075:                     android:textStyle="bold"
00076:                     android:id="@+id/zone_tv"
00077:                     android:layout_width="wrap_content"
00078:                     android:layout_height="wrap_content"
00079:                     android:layout_marginLeft="25dp"
00080:                     android:text="@string/dev_text_rain_skip"
00081:                     android:layout_toRightOf="@+id/plan_iv"
00082:                     android:layout_centerVertical="true"/>
00083:                 <me.goldze.mvvmhabit.widget.widget.NightToggleButton
00084:                     android:id="@+id/rain_tb"
00085:                     android:background="@drawable/dev_selector_switch_btn"
00086:                     android:layout_width="45dp"
00087:                     android:layout_height="20dp"
00088:                     android:layout_marginRight="17dp"
00089:                     android:checked="true"
00090:                     android:textOn=""
00091:                     android:textOff=""
00092:                     android:layout_alignParentRight="true"
```

```xml
00152:                     android:layout_marginRight="17dp"
00153:                     android:checked="true"
00154:                     android:textOn=""
00155:                     android:textOff=""
00156:                     android:layout_alignParentRight="true"
00157:                     android:layout_centerVertical="true"/>
00158:             </me.goldze.mvvmhabit.widget.widget.NightRelativeLayoutRadius>
00159:             <me.goldze.mvvmhabit.widget.widget.NightRelativeLayoutRadius
00160:                 android:id="@+id/seasonal_adjust_rl"
00161:                 android:layout_width="match_parent"
00162:                 android:layout_height="54dp"
00163:                 android:layout_marginTop="6dp">
00164:                 <ImageView
00165:                     android:id="@+id/fen_iv2"
00166:                     android:layout_width="wrap_content"
00167:                     android:layout_height="wrap_content"
00168:                     android:layout_marginLeft="15dp"
00169:                     android:src="@mipmap/dev_ic_seasonal_adjust"
00170:                     android:layout_centerVertical="true"/>
00171:                 <me.goldze.mvvmhabit.widget.widget.NightTextView
00172:                     android:textSize="15sp"
00173:                     android:textStyle="bold"
00174:                     android:layout_width="wrap_content"
00175:                     android:layout_height="wrap_content"
00176:                     android:layout_marginLeft="25dp"
00177:                     android:layout_marginRight="10dp"
00178:                     android:text="@string/dev_text_seasonal_adjust_skip"
00179:                     android:layout_toLeftOf="@+id/seasonal_tb"
00180:                     android:layout_toRightOf="@+id/fen_iv2"
00181:                     android:layout_centerVertical="true"/>
00182:                 <me.goldze.mvvmhabit.widget.widget.NightToggleButton
00183:                     android:id="@+id/seasonal_tb"
00184:                     android:background="@drawable/dev_selector_switch_btn"
00185:                     android:layout_width="45dp"
00186:                     android:layout_height="20dp"
00187:                     android:layout_marginRight="17dp"
00188:                     android:checked="true"
00189:                     android:textOn=""
00190:                     android:textOff=""
00191:                     android:layout_alignParentRight="true"
```
