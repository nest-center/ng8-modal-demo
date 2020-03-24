# Modal测试

### 项目名称：ng8-modal-demo

---

## 安装NodeJs版本管理工具`nvm`

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash

source ~/.bashrc

nvm -h

```

可以到这里下载安装最新稳定版本 [https://github.com/creationix/nvm](https://github.com/creationix/nvm)


## 安装NodeJs
```
$ nvm ls-remote --lts   # 查看nodeJS最新稳定版本
$ nvm install v10.14.2 (此项目v8以上即可)
$ nvm alias default v10.14.2  # 设置为默认版本
$ node -v   # 查看node版本，检测node是否安装正常
$ npm -v    # 查看npm版本，检测npm是否安装正常
```

## 安装依赖包
```
$ cd ng8-modal-demo
$ npm install    #安装node依赖包
```

## 测试

```bash
$ http://localhost:4200
```
