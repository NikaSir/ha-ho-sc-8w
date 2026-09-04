# IIC-800 weekday order evidence

## Iic800Constant.<clinit>

```smali
.method static constructor <clinit>()V
    .registers 2

    .line 11
    new-instance v0, Ljava/util/ArrayList;

    invoke-direct {v0}, Ljava/util/ArrayList;-><init>()V

    sput-object v0, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->historyBeans:Ljava/util/List;

    .line 12
    const-string v0, "IIC_800"

    sput-object v0, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->devType:Ljava/lang/String;

    .line 13
    const-string v1, "IIC_400"

    sput-object v1, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->IIC_400:Ljava/lang/String;

    .line 14
    const-string v1, "IIC_600"

    sput-object v1, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->IIC_600:Ljava/lang/String;

    .line 15
    sput-object v0, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->IIC_800:Ljava/lang/String;

    .line 16
    const-string v0, "IIC_801"

    sput-object v0, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->IIC_801:Ljava/lang/String;

    const/16 v0, 0x8

    .line 27
    new-array v0, v0, [I

    fill-array-data v0, :array_2c

    sput-object v0, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->images:[I

    const/4 v0, 0x7

    .line 33
    new-array v0, v0, [I

    fill-array-data v0, :array_40

    sput-object v0, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->weeks:[I

    return-void

    nop

    :array_2c
    .array-data 4
        0x7f100b20
        0x7f100b21
        0x7f100b22
        0x7f100b23
        0x7f100b24
        0x7f100b25
        0x7f100b26
        0x7f100b28
    .end array-data

    :array_40
    .array-data 4
        0x7f141c96
        0x7f141c70
        0x7f141ca5
        0x7f141ca8
        0x7f141c9b
        0x7f141c68
        0x7f141c8b
    .end array-data
.end method
```

## Resource IDs referenced by the initializer

### `0x7f100b20`
```text
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_switch_on.webp
      (night-xhdpi) (file) res/mipmap-night-xhdpi-v8/iic_switch_on.webp
    resource 0x7f100b20 mipmap/iic_zone1_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone1_default_ic.webp
    resource 0x7f100b21 mipmap/iic_zone2_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone2_default_ic.webp
    resource 0x7f100b22 mipmap/iic_zone3_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone3_default_ic.webp
    resource 0x7f100b23 mipmap/iic_zone4_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone4_default_ic.webp
```

### `0x7f100b21`
```text
    resource 0x7f100b20 mipmap/iic_zone1_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone1_default_ic.webp
    resource 0x7f100b21 mipmap/iic_zone2_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone2_default_ic.webp
    resource 0x7f100b22 mipmap/iic_zone3_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone3_default_ic.webp
    resource 0x7f100b23 mipmap/iic_zone4_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone4_default_ic.webp
    resource 0x7f100b24 mipmap/iic_zone5_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone5_default_ic.webp
```

### `0x7f100b22`
```text
    resource 0x7f100b21 mipmap/iic_zone2_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone2_default_ic.webp
    resource 0x7f100b22 mipmap/iic_zone3_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone3_default_ic.webp
    resource 0x7f100b23 mipmap/iic_zone4_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone4_default_ic.webp
    resource 0x7f100b24 mipmap/iic_zone5_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone5_default_ic.webp
    resource 0x7f100b25 mipmap/iic_zone6_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone6_default_ic.webp
```

### `0x7f100b23`
```text
    resource 0x7f100b22 mipmap/iic_zone3_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone3_default_ic.webp
    resource 0x7f100b23 mipmap/iic_zone4_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone4_default_ic.webp
    resource 0x7f100b24 mipmap/iic_zone5_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone5_default_ic.webp
    resource 0x7f100b25 mipmap/iic_zone6_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone6_default_ic.webp
    resource 0x7f100b26 mipmap/iic_zone7_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone7_default_ic.webp
```

### `0x7f100b24`
```text
    resource 0x7f100b23 mipmap/iic_zone4_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone4_default_ic.webp
    resource 0x7f100b24 mipmap/iic_zone5_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone5_default_ic.webp
    resource 0x7f100b25 mipmap/iic_zone6_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone6_default_ic.webp
    resource 0x7f100b26 mipmap/iic_zone7_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone7_default_ic.webp
    resource 0x7f100b27 mipmap/iic_zone7_defult_ic
      (mdpi) (file) res/mipmap-mdpi-v4/iic_zone7_defult_ic.webp
```

### `0x7f100b25`
```text
    resource 0x7f100b24 mipmap/iic_zone5_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone5_default_ic.webp
    resource 0x7f100b25 mipmap/iic_zone6_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone6_default_ic.webp
    resource 0x7f100b26 mipmap/iic_zone7_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone7_default_ic.webp
    resource 0x7f100b27 mipmap/iic_zone7_defult_ic
      (mdpi) (file) res/mipmap-mdpi-v4/iic_zone7_defult_ic.webp
    resource 0x7f100b28 mipmap/iic_zone8_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone8_default_ic.webp
```

### `0x7f100b26`
```text
    resource 0x7f100b25 mipmap/iic_zone6_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone6_default_ic.webp
    resource 0x7f100b26 mipmap/iic_zone7_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone7_default_ic.webp
    resource 0x7f100b27 mipmap/iic_zone7_defult_ic
      (mdpi) (file) res/mipmap-mdpi-v4/iic_zone7_defult_ic.webp
    resource 0x7f100b28 mipmap/iic_zone8_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone8_default_ic.webp
    resource 0x7f100b29 mipmap/iic_zone8_defult_ic
      (mdpi) (file) res/mipmap-mdpi-v4/iic_zone8_defult_ic.webp
```

### `0x7f100b28`
```text
    resource 0x7f100b27 mipmap/iic_zone7_defult_ic
      (mdpi) (file) res/mipmap-mdpi-v4/iic_zone7_defult_ic.webp
    resource 0x7f100b28 mipmap/iic_zone8_default_ic
      (xhdpi) (file) res/mipmap-xhdpi-v4/iic_zone8_default_ic.webp
    resource 0x7f100b29 mipmap/iic_zone8_defult_ic
      (mdpi) (file) res/mipmap-mdpi-v4/iic_zone8_defult_ic.webp
    resource 0x7f100b2a mipmap/im03w_pair
      (xhdpi) (file) res/mipmap-xhdpi-v4/im03w_pair.gif
    resource 0x7f100b2b mipmap/img
      (xhdpi) (file) res/mipmap-xhdpi-v4/img.webp
```

### `0x7f141c96`
```text
    resource 0x7f141c95 string/normal_step
      () "Step"
    resource 0x7f141c96 string/normal_sunday
      () "Sun"
    resource 0x7f141c97 string/normal_suspend
      () "Suspend"
    resource 0x7f141c98 string/normal_switch_off
      () "OFF"
    resource 0x7f141c99 string/normal_switch_on
      () "ON"
```

### `0x7f141c70`
```text
    resource 0x7f141c6f string/normal_menu
      () "Menu"
    resource 0x7f141c70 string/normal_monday
      () "Mon"
    resource 0x7f141c71 string/normal_more
      () "More"
    resource 0x7f141c72 string/normal_name
      () "Name"
    resource 0x7f141c73 string/normal_next
      () "Next"
```

### `0x7f141ca5`
```text
    resource 0x7f141ca4 string/normal_tip
      () "Tip"
    resource 0x7f141ca5 string/normal_tuesday
      () "Tue"
    resource 0x7f141ca6 string/normal_upload
      () "Upload"
    resource 0x7f141ca7 string/normal_verification_code
      () "Verification Code"
    resource 0x7f141ca8 string/normal_wednesday
      () "Wed"
```

### `0x7f141ca8`
```text
    resource 0x7f141ca7 string/normal_verification_code
      () "Verification Code"
    resource 0x7f141ca8 string/normal_wednesday
      () "Wed"
    resource 0x7f141ca9 string/not_find_router
      () "No Router Found by Device"
    resource 0x7f141caa string/not_link
      () "Do Not Associated"
    resource 0x7f141cab string/not_reset
      () "Device Not Reset, Failed to Connect"
```

### `0x7f141c9b`
```text
    resource 0x7f141c9a string/normal_target
      () "Target"
    resource 0x7f141c9b string/normal_thursday
      () "Thu"
    resource 0x7f141c9c string/normal_time_H
      () "H"
    resource 0x7f141c9d string/normal_time_M
      () "M"
    resource 0x7f141c9e string/normal_time_S
      () "S"
```

### `0x7f141c68`
```text
    resource 0x7f141c67 string/normal_food_thermometers
      () "Food Thermometers"
    resource 0x7f141c68 string/normal_friday
      () "Fri"
    resource 0x7f141c69 string/normal_high
      () "High"
    resource 0x7f141c6a string/normal_hold
      () "Hold"
    resource 0x7f141c6b string/normal_internal
      () "Internal"
```

### `0x7f141c8b`
```text
    resource 0x7f141c8a string/normal_room_no_device_yet
      () "No device has been added to this room yet."
    resource 0x7f141c8b string/normal_saturday
      () "Sat"
    resource 0x7f141c8c string/normal_save
      () "Save"
    resource 0x7f141c8d string/normal_save_and_apply
      () "Save and apply"
    resource 0x7f141c8e string/normal_save_success
      () "Saving succeeded"
```
