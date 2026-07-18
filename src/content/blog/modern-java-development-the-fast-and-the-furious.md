---
title: "Modern Java Development – The Fast And The Furious"
date: 2023-02-05T18:41:58
updated: 2023-12-20T22:33:01
tags: ["development", "java", "programming", "quarkus"]
cover: "/wp-content/uploads/2023/12/DALL·E-2023-12-19-22.20.48-Create-a-retro-style-image-for-a-blog-post-about-a-vintage-car-rally.-The-image-should-have-a-vintage-aesthetic-using-a-color-palette-of-dark-green-.png"
cardTag: "Development · Java"
wpId: 60
wpSlug: "modern-java-development-the-fast-and-the-furious"
---

**A small throwback in history…**

Remember the days when Java was created at Sun Microsystems? More specifically, when James Gosling led a team of researchers in an attempt to create a new language that would allow electronic consumer devices to communicate with each other. Efforts on the language began in 1991 and the first release occurred in 1995.

The difference between the way Java and other programming languages were working was at least revolutionary. Code in other languages was first translated by a compiler into instructions for a specific type of computer, while the Java compiler instead converted code into something called Bytecode, which is then interpreted by software called the Java Runtime Environment (JRE) (or the Java virtual machine).

For some decades, Java was the undisputed number one programming language. We define it as an interpreted, moderately complex, multi-threaded, garbage-collected and powerful programming platform. Moreover, the JVM is battle-tested, powerful, mature and one of the best Process Virtual Machines in the industry. At the time, Java was perfect for large, monolithic enterprise applications.

![](/wp-content/uploads/2022/12/Slide4-1024x576.png)

Even today it is still one of the most popular programming languages today due to many reasons :

-   It has outstanding IDE’s supporting the development
-   There is a very big community and support of major players
-   The language was and is a mature, secure, stable and robust ecosystem
-   It is a JVM based-language & deratives (Java, Kotlin, Groovy, and Scala)
-   It ensures platform independency

On the other hand we encounter different challenges to the traditional Java ecosystem:

1.  _Reflection_: Reflection is used to get, examine or modify the behavior of methods, classes, and interfaces at runtime. It’s used by many Java frameworks like **Spring** to load and instantiate Beans in a dynamic way.
2.  _Reflective Data Cache_: Because Reflection is slow frameworks like Spring uses a cache to store objects and beans.
3.  _Big package size_
4.  _Slow Dynamic Classloading_
5.  _ClassPath scanning_
6.  _Runtime Proxies_
7.  _Runtime Byte-code generation_: The interpretation process that converts Java bytecode to machine code happens in the runtime. Because interpretation is slow, Java uses the JIT compiler, trying to improve the performance.
8.  Java 8 memory limits in _Containers_ \[solved later\]

![](/wp-content/uploads/2022/12/image-1024x576.png)

Unfortunately, with the rise of Microservices and Serverless, Java had become disadvantageous as the JVM seems too large (high memory footprint) and slow (slow start-up time).And, as we can observe in modern container-based development, the container comes with limited resources. Considering all these points, we are reaching fresh challenges in terms of new **Software Architectures**:

-   Challenges to use Java in Microservices/ Serverless scenarios
-   Famous tools and frameworks: they are not optimized for low memory and _Cold Start_

As a result of this, people started to use other, small and faster languages, like Node.js, Rust or Golang in Cloud-Native development.

The question therefore is why we need _**java**_ but as we all know…

“**_Java Developers never RIP,  
They just get Garbage Collected_**“

… we can easily move to other languages like _GO & Rust_ that give us a bitter performance.

But actually, we cannot provide a straight answer because of Java’s world wide popularity:

-   After 25+ years _Java_ is still a very popular language, more in particular for large organizations.
-   Throughout the years Java introduced new updates and solutions to adapt to many industry trends like:
    -   Reactive programming
    -   Cloud: Spring Cloud that quickly builds some of the common patterns in distributed systems (Routing, Service Discovery, circuit breakers, and more)
    -   New features that have been added to the language since Java 8 till now

Finally, the Java Community started to offer a modern version of Java with **GraalVM**:

![](/wp-content/uploads/2022/12/image-2-1024x722.png)

No, not that old bike, we needed something fast and furious. Rather something like this… GraalVM.

![](/wp-content/uploads/2022/12/Slide9-1024x576.png)

GraalVM is JDK distribution that offers AOT compilation and polyglot programming. Moreover, it compiles directly to Native Code and is perfectly suitable for Cloud Native Development (because of its low memory footprint and fast start-up time).

Thanks to the GraalVM innovation, new frameworks could arise like Quarkus, Micronaut & Spring Native for cloud development. Before diving into these frameworks, we’ll start by taking a closer look to GraalVM.

We do can tell, Java is here to stay and will not disappear soon at least!

A new era of speed arises

**The rise of Java Microframeworks**

First, we are taking a small sidestep to look at Microframeworks. In the past, we used to build large monolithic architectures, but these had their pitfalls. Since they combined multiple functional modules, whenever one module failed, everything failed. So, we began breaking them down into separate modules, ‘microservices’, which minimised their dependencies and reduced the impact of one of the services failing. These microservices were meant to work separately from each other, deployed on separate servers, running in their own specific environment.

![](/wp-content/uploads/2022/12/Slide12-1024x576.png)

With the rise of cloud computing, these services became serverless (function-as-a-service), eliminating the complexity of building and maintaining the infrastructure that normally accompanied the development and launch of new applications.

Accordingly, by virtualising the environments on which our services ran, we made them sustainable and flexible, we automated delivery and made the services highly scalable. Especially in a cloud environment, we can easily scale those services…. but in the end, our resources are still finite!

![](/wp-content/uploads/2022/12/image-4.png)

So, we had to rethink it: how can or should we use less resources?

![](/wp-content/uploads/2022/12/image-5.png)

Therefore we first need to take a closer look to microframeworks. To start with, the name refers to minimalistic web application frameworks. These frameworks are composed:

-   without authentication and authorzation
-   without database abstraction via object-relational mapping
-   without input validation an input sanitation

Some examples of microframeworks are Javalin, Micronaut, Helidon, Quarlus, …

But fewer modules, functions and dependencies aren’t sufficient … If we take a closer look at the number of lines of code related to start-up time and memory usage, we can also immediately notice the impact when using reflection.The result? Well, there goes our speed. Just line up and wait in the queue, please.

![](/wp-content/uploads/2022/12/image-8-1024x513.png)

he result? Well, there goes our speed. Just line up and wait in the queue, please.

![](/wp-content/uploads/2022/12/image-6-819x1024.png)

…. given all this, is it still posisble to have the same productivity but without reflection?

Of course there is, and we can do this with **AOT** compilation.

_**Ahead of Time (AOT) Compilation**_  
_“Compiling high level programminglanguage or intermediaterepresentationsuch as java byte code into native machine codesothattheresultingbinary filecanexecutenatively.”_

**AOT** will result in:

-   short startup time
-   dependency injection at compile time
-   can be run with as little as 15m Max Heap

After getting a first glimpse of AOT, we are ready to board our supersonic car we call GraalVM.

GraalVM

The “GraalVM” project started out as a research project inside **Oracle Labs**, attempting to reduce Java memory and CPU consumption in addition to improving the performance of the Applications. The project is **written in Java** and the main focus of the project was to improve the JIT compiler in Java and introduce Ahead-of-Time (AOT) compilation which is called **Native-image.**

GraalVM is a tool designed for developers to write and execute Java code. Specifically, GraalVM is a Java Virtual Machine (JVM) and Java Development Kit (JDK) created by Oracle. It is a powerful runtime that improves application performance and efficiency.

**Why is it actually called GraalVM?**

_The word “**Graal**” comes from old French for “**Grail**”. The “Graal” Oracle project started out as a research project inside Oracle Labs, attempting to make a Java compiler while being fast and easy to maintain._  
_The “**VM**” in “GraalVM” comes from the fact that it runs inside the JVM._            

We can define the main objectives of GraalVM as:

-   Writing a **compiler** that is faster and easier to maintain
-   Having a Low-footprint and a fast start-up Java for Cloud and Serverless
-   Improving the **performance** of languages that run on the JVM (and so reducing application startup times)
-   Integrating **multi-language** **support** into the Java ecosystem, as well as providing a set of programming tools to do so

To achieve these goals, GraalVM adds an optimising compiler to the JDK, which provides performance optimisations for individual languages and interoperability for polyglot applications. Besides supporting Java code, GraalVM also supports additional programming languages including Scala, Kotlin, Groovy, Clojure, R, Python, JavaScript, Ruby. In essence, GraalVM allows developers to run code efficiently in multiple languages and libraries while in a single application.

In addition, GraalVM provides a framework for creating language-agnostic tools like debuggers, profilers, or other instrumentations. Accordingly, it will provide a standardised way to express and execute programme code. This will enable cross-language research, as well as the development of tools that once developed can then be applied to any language.

#### Components of GraalVM  

Among others, we distinguish three main components that make up the core of GraalVM:

-   **Just-in-time compiler** a high performance optimizing just-in-time compiler which is written in modular, maintainable, and extendable fashion in Java itself, to replace the old **C++ written(C1/C2)** HotSpot Java Virtual Machine.
-   **Ahead-of-time compiler** to build native executables
-   **multiple languages support**: the ability to implement language interpreters. This allows GraalVM to be expanded to add additional languages to the Java ecosystem. It also supports tools such as a language-agnostic debugger, profiler and heap viewer.

![](/wp-content/uploads/2022/12/image-10-1024x520.png)

#### How does GraalVM work?

The GraalVM just-in-time compiler is used to accelerate the performance of any Java and JVM-based application without the need for code changes. GraalVM can also use its ahead-of-time native image compiler to translate Java and JVM applications into native platform executables. The Enterprise version compiler includes 62 compiler optimisation algorithms, also called phases. Of these algorithms, some include techniques for vectorising complex programmes, code specialisation and large-scale escape analysis. Compiler phases are optimised by using techniques such as aggressive and polymorphic inlining.

_In object-oriented programming, polymorphism (from the Greek meaning “having multiple forms”) is the characteristic of being able to assign a different meaning or usage to something in different contexts – specifically, to allow an entity such as a variable, a function, or an object to have more than one form._

Object allocations are also improved through optimizations made in memory-allocation. For example, GraalVM will use partial escape analysis and scalar replacement for such tasks. In general, GraalVM can achieve better performance with less memory.

Potential attack surfaces are also minimized when the ahead-of-time compiler compiles Java code into a native executable. This is because only the code required to execute the application is included. To do this, GrallVM will analyze the application code, its dependencies, dependent JDK libraries and VM components.

![](/wp-content/uploads/2022/12/image-11-1024x362.png)

When we compile our Java programme (e.g., using the Java command), we’ll end up with our source code compiled into the binary representation of our code – a JVM bytecode (1). This bytecode is simpler and more compact than our source code, but conventional processors in our computers cannot execute it.

To be able to run a Java programme, the JVM interprets the bytecode (2). Since interpreters are usually a lot slower than native code executing on a real processor, the JVM can run another compiler which will now compile our bytecode into the machine code that can be run by the processor. This so-called just-in-time compiler is much more sophisticated than the javac compiler, and it runs complex optimisations to generate high-quality machine code.

GraalVM can compile the code Just-In-Time (JIT) or Ahead of Time (AOT) directly to native image (3).

There is a general myth that AOT is faster, which is very true in the first few runs, but there is a possibility that the JIT might outperform the AOTs, as JIT is constantly optimising (Graal VM) based on the feedback it gets from profiling. JIT normally has a larger footprint than AOT.

For Serverless — it makes more sense to go towards AOT, while for long running container based/VM based deployments, JIT might make more sense.

In theory, **a Just-in-Time (JIT) compiler has an advantage over Ahead-of-Time (AOT) if it has enough time and computational resources available**. A JIT compiler can be faster because the machine code is being generated on the exact machine that it will also execute on.

The Graal compiler also works as an ahead-of-time (AOT) compiler, producing native executables. Given Java’s dynamic nature, how does that work exactly?

Unlike JIT mode, where compilation and execution happen at the same time, in AOT mode the compiler performs **all** compilations during build time, before the execution. The main idea here is to **move all the “heavy lifting” — expensive computations — to build time**, so it can be done once, and then at runtime generated executables start fast and are ready from the get-go because everything is pre-computed and pre-compiled.

The GraalVM ‘native-image’ utility takes Java bytecode as input and outputs a native executable. To do so, the utility performs a static analysis of the bytecode under a closed world assumption. During the analysis, the utility looks for all the code that your application actually uses and eliminates everything that is unnecessary.

![](/wp-content/uploads/2022/12/image-12-1024x418.png)

These three key concepts help you better understand the Native Image generation process:

-   **Points-to analysis**. GraalVM Native Image determines which Java classes, methods, and fields are reachable at runtime, and only those will be included in the native executable. The points-to analysis starts with all entry points, usually the main method of the application. The analysis iteratively processes all transitively reachable code paths until a fixed point is reached and the analysis ends. This applies not only to the application code but also to the libraries and JDK classes — everything that is needed for packaging an application into a self-contained binary.

-   **Initializations at build time**. GraalVM Native Image defaults to class initialization at runtime to ensure correct behavior. But if Native Image can prove that certain classes are safe to initialize, it will initialize them at build time instead. This makes runtime initialization and checks unnecessary and improves performance.

-   **Heap snapshotting**. Heap snapshotting in Native Image is a very interesting concept and deserves its own article. During the image build process, Java objects allocated by static initializers, and all the objects that are reachable, are written onto the image heap. This means that your application starts much faster with a pre-populated heap.

Still, there are some limitations on using the Native Image as e.g.:

-   **Dynamic Class Loading**: Deploying jars, wars, etc. at runtime impossible.

-   **Reflection**: Requires registration via native-image CLI/API.

-   **Dynamic Proxy**: No agents: JMX, JRebel, Byteman, profilers, tracers, etc.

**GraalVM**  
**The word “Graal” comes from old French (or Dutch?)  for “Grail”**    
_The “_**_Graal_**_” Oracle project started out as a research project inside_ **_Oracle Labs_**_, attempting to make a Java_ **_compiler_** _while being_ **_fast and easy_** _to maintain._  
_The “_**_VM_**_” in “GraalVM” comes from the fact that it_ **_runs inside the JVM_**_._

Microprofile

Microprofile is a community-driven **specification** which is is designed to provide a **baseline platform definition**. Firstly to optimizes the **Enterprise** Java _for microservices architecture_ and secondly to deliver application **portability** across multiple MicroProfile runtimes.

The founding vendors of MicroProfile offered their own microservices frameworks:

-   Open Liberty (_IBM_),
-   WildFly Swarm (_Red Hat_)  => Thorntail  => **Quarkus**,
-   TomEE (_Tomitribe_),
-   Payara Micro (_Payara_)

Quarkus

**Quarkus** is a **MicroProfile implementation** that focuses on efficiently running Java applications in containers in general and Kubernetes in particular.

It is a **framework developed by RedHat for creating Java applications**. Quarkus was developed with the goal of running Java programs in containers. In particular, it focuses on supporting orchestration software Kubernetes.  
Another focus of Quarkus development is on the use of established Java libraries and standards.

“HotSpot”, from the OpenJDK project, is used as a Java Virtual Machine (JVM) to be the execution layer for Java code. In addition, the “GraalVM” development, which builds on HotSpot, can also be used. The latter allows **Java code to be compiled into directly executable machine code**.

In order to understand the immediate benefit of using Quarkus, let’s first look at how Java applications run with and without Quarkus.

**So how does a regular framework work?**

![](/wp-content/uploads/2022/12/image-13-1024x417.png)

When the traditional Java cloud native frameworks start there are certain set of activities which are performed during the build time.

Secondly, there’s a certain set of activities which are performed during the runtime. Now these activities which are performed by the traditional framework during the build time or the compile time, is primarily the application packaging part, which is usually done using build tools like maven, gradle etc.

The remaining set of activities like loading of the configuration file, scanning the class path to find the annotated classes and read annotations, reading the XML descriptors, starting the thread pool and so on and done during the runtime when the application starts. So this means that since most of the activities are performed during the runtime instead of compile time, hence the application startup time is more when you run your applications using traditional java cloud native frameworks.

  
When the traditional Java cloud native frameworks start there are certain set of activities which are performed during the build time.Secondly, there’s a certain set of activities which are performed during the runtime. Now these activities which are performed by the traditional framework during the build time or the compile time, is primarily the application packaging part, which is usually done using build tools like maven, gradle etc. The remaining set of activities like loading of the configuration file, scanning the class path to find the annotated classes and read annotations, reading the XML descriptors, starting the thread pool and so on and done during the runtime when the application starts. So this means that since most of the activities are performed during the runtime instead of compile time, hence the application startup time is more when you run your applications using traditional java cloud native frameworks.As with other programming languages, a Java programme begins with source code that can be read by a human. In order to execute the instructions of the source text on a computer, corresponding instructions are generated in the format of the specific processor.

With Java, there is another intermediate step: The source text is first translated into an intermediate format, the so-called bytecode, as is the case with the Python language. The bytecode is then executed in the “Java virtual machine” (JVM). In order to run a Java programme on a device, a JVM must be installed on it.

The bytecode is traditionally interpreted for execution in the JVM. The bytecode instructions are translated piece by piece into machine code instructions and executed. The process of “just-in-time compilation” (JIT) is more effective. With that process, the bytecode is also converted into machine code, but further optimizations also come into play.

![](/wp-content/uploads/2022/12/Slide39-1024x576.png)

**Let’s do it the Quarkus way**

The new way or the Quarkus way to optimise the application start-up time is that Quarkus performs most of the activities during the build time instead of runtime.

Loading of the configuration files, class path scanning, read and set the properties etc. are performed during the build time. This means that the metadata is only processed once during the build time.

So when your application starts, since all the metadata is already loaded and set during build time, it minimises the need of dynamic scanning and loading of classes during the runtime. Naturally this results in a significant improvement in the startup times of the applications. So this is the way Quarkus works behind the scenes and the reason for its **supersonic, subatomic nature**.

![](/wp-content/uploads/2022/12/image-14-1024x365.png)

In contrast to the native execution of Java applications, Quarkus offers several advantages. Let’s differentiate between **the** **two** **modes** **supported** **by** **Quarkus**:

1.  **Optimization of the bytecode** and execution in the JVM
2.  **Running as native code** after compilation

Java code written with Quarkus can be executed normally in the JVM. However, there are considerable advantages in terms of memory consumption and start time of a running application. To achieve this, Quarkus uses a few tricks.

In particular, a number of **time-consuming steps are moved from the execution to the build process**.

This includes the steps that otherwise occur every time a Java application is executed:

-   Loading and parsing configurations
-   Scanning the Java class path and resolving annotations
-   Creating entity models for databases or the like where applicable

With Quarkus, these steps are carried out once and the results are cached for quick retrieval. Further performance optimization comes in the form of **Quarkus** **reducing the amount of dynamic information available at runtime**. This is replaced by corresponding static constructs. This is particularly useful with regard to use in containers. A containerized application is usually not changed anyway and always runs in the same environment.

The second mode supported by Quarkus for running Java applications is even more interesting. With “ahead-of-time compilation” (AOT), **directly executable machine code is generated from the Java source text instead of bytecode**, meaning there is no longer any need for a JVM on the target hardware. The program only runs on specific processor architecture and has to be recompiled for other platforms. However, this restriction is usually irrelevant for use in containers. The savings in memory consumption and application startup time achieved with AOT compilation are nothing short of breathtaking.

**Pros and cons of Quarkus?**

**Pros:**

-   User friendliness (JEE & Spring devs), solid framework,:
    -   **“best of breed”** framework standards, e.g. Eclipse MicroProfile, Spring Dependency Injection, Hibernate ORM
-   Performance:
    -   fast application start-up time,
    -   low memory consumption,
    -   almost immediate scaling of services,
    -   lower space requirements for native images

**Cons:**

-   Reducing the dynamic information generated during runtime can lead to problems in some scenarios.
-   The severely limited possibilities for introspection may make it **difficult to debug** an application.
-   The highly-optimized build process for native images **takes a long time**…

![](/wp-content/uploads/2022/12/image-15.png)

Micronaut

Micronaut is a modern Java framework that can be used to build microservices and serverless applications tailored for JDK and GraalVM. It is developed by the creators of the Grails framework and sponsored by Object Computing, Inc. Micronaut development started on early 2018, the 1.0.0 version was released on October 2018.

Micronaut is an open source JVM-based software framework for building lightweight, modular applications and microservices. It is known for its ability to help developers create applications and microservices with small memory footprints and short start-up times (logically, same specs as Quarkus).

It’s created to address some of the weaknesses of Spring/Spring Boot. Developed by OCI, the same company that created Grails, Micronaut is a framework designed to make creating microservices quick and easy. While Micronaut contains some features that are similar to existing frameworks like Spring, it also has some new features that set it apart. And with support for Java, Groovy, and Kotlin, it offers a variety of ways to create applications.

#### Main Features

One of the most exciting features of Micronaut is its compile time dependency injection mechanism. Most frameworks use reflection and proxies to perform dependency injection at runtime. **Micronaut, however, builds its dependency injection data at compile time.** The result is faster application startup and smaller memory footprints.

**Another feature is its first class support for reactive programming, for both clients and servers.** The choice of a specific reactive implementation is left to the developer as both RxJava and Project Reactor are supported.

Micronaut also has several features that make it an excellent framework for developing cloud-native applications. It supports multiple service discovery tools such as Eureka and Consul, and also works with different distributed tracing systems such as Zipkin and Jaeger.

Micronaut provides natively support to many cloud features:

-   Distributed Configuration with:
    -   HashiCorp Consul
    -   HashiCorp Vault
    -   Spring Cloud Config
    -   AWS Parameter Store
-   Service Discovery with:
    -   Consul
    -   Eureka
    -   Kubernetes
    -   AWS Route 53
-   Serverless Functions: many features are provided to make it easier to write functions, run and deploy them to Function as a Service (FaaS) providers such as AWS Lambda or dedicated containers such as OpenFaaS.

Micronaut projects can also be generated with an online generator: Micronaut Launch.

The framework was created from the ground up to support work with microservices and serverless functions. The creators advertise it as a natively cloud-native stack, meaning various aspects of cloud deployment (service discovery, distributed tracing, fast start-up, and small memory footprint) have been considered while designing the framework. Although it is cloud-focused, we can create command-line applications as well.

Because of the ahead-of-time compilation and resolving DI during the build phase, the memory usage and start-up times are low. Such features are crucial when working with serverless functions (cf. microframeworks).

**So, when should you use it?**

Let’s say, you need native images but you cannot handle living on the bleeding edge or having frequent updates or you may need something special, Micronaut might be your solution.It’s can be used for Spring MVC/Spring Boot, which is the most dominant Server-Side framework in Java. It also uses the conventional OpenJDK, but this will slowly lose its charm in Cloud-Native Java Development.

![](/wp-content/uploads/2022/12/image-17-1024x576.png)

## Spring Native

Spring is a very popular framework as it helps to build Java web applications easily and quickly (compared to the old Java frameworks). It uses the conventional OpenJDK and introduces many features and integrations with other technologies like Spring Boot, Spring Cloud, Spring Data, Spring AWS and Project Reactor.

The biggest competition today is about building more efficient Java applications for the Cloud ecosystem and therefore logically the Spring community wants to be a part of this competition. That’s why Spring declared a new solution called Spring Native which will use GraalVM for Cloud-Native development.

The main difference between Spring and Spring Native images:

-   No class lazy loading as everything shipped in the executables will be loaded in memory on start-up;
-   Classpath scanning is fixed at build time;
-   Static analysis of your application from the main entry point, is performed at build time;
-   Removing the unused parts of the codebase at build time;
-   Configuration is required for reflection, resources, and dynamic proxies.

It’s time for a line-up

![](/wp-content/uploads/2022/12/image-16-952x1024.png)

**Quarkus**

-   It is suitable for a wide range of different application scenarios.
-   Other frameworks are more specific to some extent.
-   It features a large new community.
-   It has fast bug fixes and feature updates.

**Micronaut**

-   With the Micronaut framework, microservices and serverless applications can be programmed in Java.
-   As with Quarkus, GraalVM is used here.
-   It is less performant then Quarkus.
-   It is supported by OCI (company which developed Grails)

**Spring Native**

-   Spring is probably the most popular Java framework for web applications, having also a broad long-term existing open source community.
-   Spring Native is based on GraalVM and, in addition to the creation of microservices, it supports reactive programming and live reload. In a performance comparison, Quarkus beats Spring Native.
-   An existing Spring project can be migrated to Quarkus relatively easily.
-   On the other hand, Quarkus comes with a more steap learning curve.

Whichever framework you choose, it is evident that Java is ready for a new era of speed and innovation. Now it is time for you to jump on board!
