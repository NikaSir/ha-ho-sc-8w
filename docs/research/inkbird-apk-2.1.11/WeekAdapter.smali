.class public Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;
.super Landroidx/recyclerview/widget/RecyclerView$Adapter;
.source "WeekAdapter.java"


# annotations
.annotation system Ldalvik/annotation/MemberClasses;
    value = {
        Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter$WeekHolder;
    }
.end annotation

.annotation system Ldalvik/annotation/Signature;
    value = {
        "Landroidx/recyclerview/widget/RecyclerView$Adapter<",
        "Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter$WeekHolder;",
        ">;"
    }
.end annotation


# instance fields
.field private inflater:Landroid/view/LayoutInflater;

.field private mContext:Landroid/content/Context;

.field private weekBeans:Ljava/util/List;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/util/List<",
            "Lcom/inkbird/inkbirdapp/device/iic800/bean/WeekBean;",
            ">;"
        }
    .end annotation
.end field


# direct methods
.method public static synthetic $r8$lambda$vRDk6jt_6RUBSQfxUYXui4zu4jo(Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;ILandroid/view/View;)V
    .registers 3

    invoke-direct {p0, p1, p2}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->lambda$onBindViewHolder$0(ILandroid/view/View;)V

    return-void
.end method

.method public constructor <init>(Landroid/content/Context;)V
    .registers 7

    .line 25
    invoke-direct {p0}, Landroidx/recyclerview/widget/RecyclerView$Adapter;-><init>()V

    .line 26
    iput-object p1, p0, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->mContext:Landroid/content/Context;

    .line 27
    invoke-static {p1}, Landroid/view/LayoutInflater;->from(Landroid/content/Context;)Landroid/view/LayoutInflater;

    move-result-object v0

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->inflater:Landroid/view/LayoutInflater;

    .line 28
    new-instance v0, Ljava/util/ArrayList;

    invoke-direct {v0}, Ljava/util/ArrayList;-><init>()V

    iput-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->weekBeans:Ljava/util/List;

    const/4 v0, 0x0

    move v1, v0

    :goto_14
    const/4 v2, 0x7

    if-ge v1, v2, :cond_2c

    .line 31
    iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->weekBeans:Ljava/util/List;

    new-instance v3, Lcom/inkbird/inkbirdapp/device/iic800/bean/WeekBean;

    sget-object v4, Lcom/inkbird/inkbirdapp/device/iic800/utils/Iic800Constant;->weeks:[I

    aget v4, v4, v1

    invoke-virtual {p1, v4}, Landroid/content/Context;->getString(I)Ljava/lang/String;

    move-result-object v4

    invoke-direct {v3, v4, v0}, Lcom/inkbird/inkbirdapp/device/iic800/bean/WeekBean;-><init>(Ljava/lang/String;Z)V

    invoke-interface {v2, v3}, Ljava/util/List;->add(Ljava/lang/Object;)Z

    add-int/lit8 v1, v1, 0x1

    goto :goto_14

    :cond_2c
    return-void
.end method

.method private synthetic lambda$onBindViewHolder$0(ILandroid/view/View;)V
    .registers 4

    .line 69
    iget-object p2, p0, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->weekBeans:Ljava/util/List;

    invoke-interface {p2, p1}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object p2

    check-cast p2, Lcom/inkbird/inkbirdapp/device/iic800/bean/WeekBean;

    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->weekBeans:Ljava/util/List;

    invoke-interface {v0, p1}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Lcom/inkbird/inkbirdapp/device/iic800/bean/WeekBean;

    invoke-virtual {v0}, Lcom/inkbird/inkbirdapp/device/iic800/bean/WeekBean;->isCheck()Z

    move-result v0

    xor-int/lit8 v0, v0, 0x1

    invoke-virtual {p2, v0}, Lcom/inkbird/inkbirdapp/device/iic800/bean/WeekBean;->setCheck(Z)V

    .line 70
    invoke-virtual {p0, p1}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->notifyItemChanged(I)V

    return-void
.end method


# virtual methods
.method public getChecks()I
    .registers 4

    const/4 v0, 0x0

    move v1, v0

    .line 44
    :goto_2
    iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->weekBeans:Ljava/util/List;

    invoke-interface {v2}, Ljava/util/List;->size()I

    move-result v2

    if-ge v0, v2, :cond_1e

    .line 45
    iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->weekBeans:Ljava/util/List;

    invoke-interface {v2, v0}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Lcom/inkbird/inkbirdapp/device/iic800/bean/WeekBean;

    invoke-virtual {v2}, Lcom/inkbird/inkbirdapp/device/iic800/bean/WeekBean;->isCheck()Z

    move-result v2

    if-eqz v2, :cond_1b

    const/4 v2, 0x1

    shl-int/2addr v2, v0

    or-int/2addr v1, v2

    :cond_1b
    add-int/lit8 v0, v0, 0x1

    goto :goto_2

    :cond_1e
    return v1
.end method

.method public getItemCount()I
    .registers 2

    .line 76
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->weekBeans:Ljava/util/List;

    invoke-interface {v0}, Ljava/util/List;->size()I

    move-result v0

    return v0
.end method

.method public bridge synthetic onBindViewHolder(Landroidx/recyclerview/widget/RecyclerView$ViewHolder;I)V
    .registers 3

    .line 19
    check-cast p1, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter$WeekHolder;

    invoke-virtual {p0, p1, p2}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->onBindViewHolder(Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter$WeekHolder;I)V

    return-void
.end method

.method public onBindViewHolder(Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter$WeekHolder;I)V
    .registers 6

    .line 60
    iget-object v0, p1, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter$WeekHolder;->textView:Landroid/widget/TextView;

    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->weekBeans:Ljava/util/List;

    invoke-interface {v1, p2}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Lcom/inkbird/inkbirdapp/device/iic800/bean/WeekBean;

    invoke-virtual {v1}, Lcom/inkbird/inkbirdapp/device/iic800/bean/WeekBean;->getName()Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, v1}, Landroid/widget/TextView;->setText(Ljava/lang/CharSequence;)V

    .line 61
    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->weekBeans:Ljava/util/List;

    invoke-interface {v0, p2}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Lcom/inkbird/inkbirdapp/device/iic800/bean/WeekBean;

    invoke-virtual {v0}, Lcom/inkbird/inkbirdapp/device/iic800/bean/WeekBean;->isCheck()Z

    move-result v0

    if-eqz v0, :cond_3a

    .line 62
    iget-object v0, p1, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter$WeekHolder;->textView:Landroid/widget/TextView;

    const v1, 0x7f080216

    invoke-virtual {v0, v1}, Landroid/widget/TextView;->setBackgroundResource(I)V

    .line 63
    iget-object v0, p1, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter$WeekHolder;->textView:Landroid/widget/TextView;

    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->mContext:Landroid/content/Context;

    invoke-virtual {v1}, Landroid/content/Context;->getResources()Landroid/content/res/Resources;

    move-result-object v1

    const v2, 0x7f060619

    invoke-virtual {v1, v2}, Landroid/content/res/Resources;->getColor(I)I

    move-result v1

    invoke-virtual {v0, v1}, Landroid/widget/TextView;->setTextColor(I)V

    goto :goto_54

    .line 65
    :cond_3a
    iget-object v0, p1, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter$WeekHolder;->textView:Landroid/widget/TextView;

    const v1, 0x7f080217

    invoke-virtual {v0, v1}, Landroid/widget/TextView;->setBackgroundResource(I)V

    .line 66
    iget-object v0, p1, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter$WeekHolder;->textView:Landroid/widget/TextView;

    iget-object v1, p0, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->mContext:Landroid/content/Context;

    invoke-virtual {v1}, Landroid/content/Context;->getResources()Landroid/content/res/Resources;

    move-result-object v1

    const v2, 0x7f06051a

    invoke-virtual {v1, v2}, Landroid/content/res/Resources;->getColor(I)I

    move-result v1

    invoke-virtual {v0, v1}, Landroid/widget/TextView;->setTextColor(I)V

    .line 68
    :goto_54
    iget-object p1, p1, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter$WeekHolder;->textView:Landroid/widget/TextView;

    new-instance v0, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter$$ExternalSyntheticLambda0;

    invoke-direct {v0, p0, p2}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter$$ExternalSyntheticLambda0;-><init>(Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;I)V

    invoke-virtual {p1, v0}, Landroid/widget/TextView;->setOnClickListener(Landroid/view/View$OnClickListener;)V

    return-void
.end method

.method public bridge synthetic onCreateViewHolder(Landroid/view/ViewGroup;I)Landroidx/recyclerview/widget/RecyclerView$ViewHolder;
    .registers 3

    .line 19
    invoke-virtual {p0, p1, p2}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->onCreateViewHolder(Landroid/view/ViewGroup;I)Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter$WeekHolder;

    move-result-object p1

    return-object p1
.end method

.method public onCreateViewHolder(Landroid/view/ViewGroup;I)Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter$WeekHolder;
    .registers 6

    .line 55
    new-instance p2, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter$WeekHolder;

    iget-object v0, p0, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->inflater:Landroid/view/LayoutInflater;

    const v1, 0x7f0d07b2

    const/4 v2, 0x0

    invoke-virtual {v0, v1, p1, v2}, Landroid/view/LayoutInflater;->inflate(ILandroid/view/ViewGroup;Z)Landroid/view/View;

    move-result-object p1

    invoke-direct {p2, p1}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter$WeekHolder;-><init>(Landroid/view/View;)V

    return-object p2
.end method

.method public setChecks(I)V
    .registers 6

    const/4 v0, 0x0

    move v1, v0

    .line 36
    :goto_2
    iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->weekBeans:Ljava/util/List;

    invoke-interface {v2}, Ljava/util/List;->size()I

    move-result v2

    if-ge v1, v2, :cond_21

    .line 37
    iget-object v2, p0, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->weekBeans:Ljava/util/List;

    invoke-interface {v2, v1}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Lcom/inkbird/inkbirdapp/device/iic800/bean/WeekBean;

    shr-int v3, p1, v1

    rem-int/lit8 v3, v3, 0x2

    if-eqz v3, :cond_1a

    const/4 v3, 0x1

    goto :goto_1b

    :cond_1a
    move v3, v0

    :goto_1b
    invoke-virtual {v2, v3}, Lcom/inkbird/inkbirdapp/device/iic800/bean/WeekBean;->setCheck(Z)V

    add-int/lit8 v1, v1, 0x1

    goto :goto_2

    .line 39
    :cond_21
    invoke-virtual {p0}, Lcom/inkbird/inkbirdapp/device/iic800/adapter/WeekAdapter;->notifyDataSetChanged()V

    return-void
.end method

