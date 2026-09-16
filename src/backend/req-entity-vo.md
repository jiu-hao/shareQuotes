---
icon: pen-to-square
date: 2026-09-16
category:
  - 后端开发
tag:
  - Java
  - 分层
  - 转型
---

# Req / Entity / VO：数据为什么要变身好几次

这是「前端转 Java」系列的第二篇，对应学习路线的阶段三。

我学到这一步的时候，最想不通的一件事是：

**为什么同一个"国家"，代码里要有三个类来表示它？**

```java
CountryReq   // 前端传上来的
Country      // 数据库里查出来的
CountryVO    // 返回给前端的
```

到处在 `new` 对象、到处在复制字段。我当时的想法是——**直接用同一个类从头传到尾不香吗？**

后来我搞明白了：**不是"同一个东西被复制了三份"，而是三件不同的事，恰好描述的是同一个业务概念。**

这篇就把这件事讲透。

## 一、先把三个角色认清楚

### Req —— 只负责"接住客户端传进来的东西"

```java
public class CountryReq {
    private String countryNameCn;
    private Integer isUnderSanction;
    private Integer pageNum;
    private Integer pageSize;
}
```

关键认知：**`Req` 不是 Java 关键字，它只是项目里的命名约定**（Request 的缩写）。这个名字不给类任何特殊能力，它唯一的用处是——**人类一眼看出"这是接口的输入"**。

真正让 HTTP 参数进到这个对象里的是 **Spring MVC**：

```
HTTP 参数
   ↓
Spring 创建 CountryReq 对象
   ↓
Spring 调 Setter 把值填进去（顺便做类型转换）
   ↓
Controller 拿到填好的 req
```

所以 `req` 里的值不是谁"传"进来的，是框架**替你塞进去的**。

### Entity —— 只负责"对应数据库里那张表"

```java
public class Country {
    private Long id;
    private String countryNameCn;
    private String code;
    private Integer isUnderSanction;
}
```

规则很简单：**一个 Entity 对象 ≈ 表里一行记录**。

- 字段名跟列名对应（靠 `@TableField` 这类注解或命名规范）
- `List<Country>` 就是多行
- 类名**不一定**带 `Entity` 后缀，直接叫 `Country` 很常见

**Entity 的字段设计跟着数据库走，不跟接口走。** 数据库有 20 个字段，Entity 就有 20 个——哪怕接口只需要 3 个。

### VO —— 只负责"给客户端看什么"

```java
public class CountryVO {
    private Long id;
    private String countryNameCn;
    private String code;
}
```

VO = View Object。它决定**对外暴露哪些字段、以什么形式暴露**。

比如数据库里 `is_under_sanction` 存的是 `0/1`，返回给前端可能想给成 `false/true`；内部有个 `delete_flag` 字段，对外**根本不该出现**。

**VO 的形状跟着接口需求走，不跟数据库走。**

## 二、为什么不能一个类走到底

我用三个具体场景说明——**如果强行合并，会出什么事**。

### 场景 1：客户端能改不该改的字段

假设直接用 Entity 当请求对象：

```java
// 危险写法
@PostMapping("/country/update")
public void update(@RequestBody Country country) {
    countryService.updateById(country);
}
```

问题来了：客户端可以传 `id`、`createTime`、`deleteFlag`、`tenantId`……**任何你没拦住的字段都能被改**。

这是个真实存在的安全漏洞类型（叫 Mass Assignment，批量赋值漏洞）。用独立的 `Req` 就没这问题——**Req 里根本没有那些字段，客户端想传也进不来**。

### 场景 2：内部字段泄漏给前端

假设直接用 Entity 当返回对象：

```java
return countryDao.selectList(wrapper);   // 直接返回 Entity
```

Entity 里如果有 `internalRemark`（内部备注）、`costPrice`（成本价）、`supplierId`（供应商 ID）——**全会被序列化成 JSON 发给浏览器**。扒一下接口返回值，商业信息就出去了。

### 场景 3：查询字段和返回字段对不上

查询要传「页码、每页多少条、筛选条件」，这些**数据库表里根本没有**。
返回要带「总条数、当前页」，这些**数据库表里也没有**。

如果只有 Entity 一个类，就得往里塞一堆纯展示用的字段——**Entity 变成了四不像，既有数据库字段又有分页参数**。

## 三、所以它们的边界是这样划的

```
客户端
  ↓  只允许传 Req 里声明的字段
[ Req ]          ← 输入边界（防越权）
  ↓
Controller
  ↓
[ Entity ]       ← 数据边界（贴合表结构）
  ↑
DAO / 数据库
  ↓
[ VO ]           ← 输出边界（控制暴露）
  ↓
客户端
```

一句话总结这三个边界的意义：

| 类 | 它守的是什么 | 如果不独立会怎样 |
|---|---|---|
| `Req` | **输入边界** | 客户端能改不该改的字段 |
| `Entity` | **数据边界** | 与表结构耦合的细节外泄 |
| `VO` | **输出边界** | 内部字段泄漏，或字段格式不合适 |

**"数据变身"不是冗余，是三道关卡。**

## 四、转换发生在哪一层

这是新手另一个容易迷糊的点：**谁来负责 `Entity → VO` 的转换？**

原则是：**转换逻辑放在业务层（Service），不放在 Controller，也不放在 DAO。**

- **DAO 只管查数据库**，返回 Entity 就完事，不该知道 VO 是什么
- **Controller 只管接参数、返回结果**，不该写字段复制代码
- **Service 在这个中间**，它最清楚业务上要暴露什么，转换放在这里

常见写法大致长这样（工具类名各项目不同，原理一样）：

```java
// Service 里
List<Country> list = countryDao.selectList(wrapper);      // 查出 Entity
List<CountryVO> voList = BeanUtil.copyToList(list, CountryVO.class);  // 转成 VO
return voList;
```

那个 `copyToList` 干的事很朴素：**按同名字段一个个复制过去**。名字对不上的字段就跳过，所以**字段名保持一致能省很多事**。

## 五、前端视角的类比

我自己是靠这个类比想通的：

| 后端 | 前端里最像的东西 |
|---|---|
| `Req` | 提交表单时构造的那个 payload 对象 |
| `Entity` | Redux store / Pinia 里存的**原始数据** |
| `VO` | 组件里**专门为了渲染整理过的 viewModel** |

前端其实也在做同样的事——**从接口拿到的原始数据，经常要整理成组件好用的形状**（改字段名、算个显示用的值、砍掉不需要的字段）。

后端只是把这个习惯**做成了分层规范**，而且多了一层"防越权"的意义（`Req` 那层前端一般不会刻意做）。

## 六、小结

三句话：

1. **`Req` / `Entity` / `VO` 不是同一个东西的三份拷贝**，是输入、存储、输出三个不同职责的载体
2. **每个类都有自己的"守边界"任务**：防越权、贴合表结构、控制暴露
3. **转换放 Service**，别图省事让 Entity 直接横穿整个系统

---

*这是「前端转 Java」系列的一篇。总纲（学习路线设计）在 [前端转 Java 后端，我是怎么排学习顺序的](/backend/java-learning-path.html)。*
