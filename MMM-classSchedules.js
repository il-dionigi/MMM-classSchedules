Module.register("MMM-classSchedules", {
  
      defaults: {
          updateInterval: 5 * 60 * 1000, // every 5 minutes
          animationSpeed: 1000,
          initialLoadDelay: 0, // 0 seconds delay
          retryDelay: 2500,
          maxHoursScheduled: 5, // maximum number of hours to show in schedule
          debug: false
      },
  
  
      scheduleInfo: {
          list: [],
          day: null,
          hour: null,
          halfhour: null
      },
  
      getStyles: function() {
          return ["MMM-classSchedules.css"];
      },
  
      start: function() {
          Log.log("Starting module: " + this.name);
  
          var d = new Date();
  
          this.scheduleInfo.day = d.getDay();
          this.scheduleInfo.hour = d.getHours();
          var m = Math.floor(d.getMinutes() / 30);
          if (m == 0) {
              this.scheduleInfo.halfhour = false;
          } else {
              this.scheduleInfo.halfhour = true;
          }
  
          this.sendSocketNotification('GET SCHEDULE', );
  
          this.scheduleUpdate(this.config.initialLoadDelay);
      },
  
      updateSchedule: function() {
          this.loaded = true;
          var d = new Date();
          this.scheduleInfo.day = d.getDay();
          this.scheduleInfo.hour = d.getHours();
          var m = Math.floor(d.getMinutes() / 30);
          if (m == 0) {
              this.scheduleInfo.halfhour = false;
          } else {
              this.scheduleInfo.halfhour = true;
          }
          this.updateDom(this.config.animationSpeed);
          this.scheduleUpdate();
      },
  
      notificationReceived: function(notification, payload, sender) {
          switch (notification) {
              case "DOM_OBJECTS_CREATED":
                  break;
          }
      },
  
      getDom: function() {
          var wrapper = document.createElement("div");
  
          if (!this.loaded) {
              wrapper.innerHTML = this.translate('LOADING');
              wrapper.className = "dimmed light small";
              return wrapper;
          }
  
          var large = document.createElement("div");
          large.className = "large light";
  
          wrapper.appendChild(this.renderSchedule());
  
          return wrapper;
      },
  
      getMilitaryTime: function(time) {
          var hour = Math.trunc(time) < 10 ? "0" + Math.trunc(time) : Math.trunc(time);
          var minutes = Math.floor((time - hour) * 2) == 0 ? "00" : "30";
          return hour + minutes;
      },
  
      renderScheduleRow: function(user, classes, time) {
          var startTime = time;
          var finalTime = time + this.config.maxHoursScheduled;
          var total = this.config.maxHoursScheduled;
          var interval = 100 / total;
  
          var row = document.createElement("tr");
          row.className = "schedule-row";
  
          var userTextSpan = document.createElement("span");
          userTextSpan.className = "schedule-user"
          userTextSpan.innerHTML = user;
  
          var scheduleBar = document.createElement("div");
          scheduleBar.className = "schedule-bar";
  
          if (classes == null) {
              var spacer = document.createElement("span");
              spacer.style.width = "100%";
          } else {
              numOfClasses = classes.length;
  
              var curTime = time;
  
              classes.forEach(function(element) {
  
                  start = curTime;
                  end = this.scheduleInfo.hour + this.config.maxHoursScheduled;
  
                  var rowStartTime = element.start;
                  var rowEndTime = element.end;
  
                  if (rowStartTime < start) {
                      if (rowEndTime > start) {
                          rowStartTime = start;
                      } else {
                          return;
                      }
                  }
  
                  if (rowEndTime > end) {
                      if (rowStartTime < end) {
                          rowEndTime = end;
                      } else {
                          return;
                      }
                  }
  
                  var bar = document.createElement("span");
                  bar.className = "bar";
                  bar.innerHTML = "&nbsp;"
                  bar.textContent = element.class;
                  var barWidth = (Math.round(interval * (rowEndTime - rowStartTime)));
                  bar.style.width = barWidth + '%';
  
                  var leftSpacer = document.createElement("span");
                  leftSpacer.style.width = Math.round((interval * (rowStartTime - start))) + "%";
                  var rightSpacer = document.createElement("span");
                  rightSpacer.style.width = Math.round((interval * (end - rowEndTime))) + "%";
  
                  scheduleBar.appendChild(leftSpacer);
                  scheduleBar.appendChild(bar);
  
                  curTime = rowEndTime;
              }, this);
  
              var rightSpacer = document.createElement("span");
              rightSpacer.style.width = Math.round((interval * (finalTime - curTime))) + "%";
              scheduleBar.appendChild(rightSpacer);
          }
  
          var scheduleBarWrapper = document.createElement("td");
          scheduleBarWrapper.appendChild(scheduleBar);
  
          row.appendChild(userTextSpan);
          row.appendChild(scheduleBarWrapper);
  
          return row;
      },
  
      renderSchedule: function() {
          var maxHours = this.config.maxHoursScheduled;
          var time = this.scheduleInfo.hour;
          var isHalfhour = this.scheduleInfo.halfhour;
          if (isHalfhour) {
              time += 0.5
          }
  
          var display = document.createElement("table");
          display.className = "schedule";
  
          var hoursRow = document.createElement("tr");
          hoursRow.width = "100%";
          hoursRow.className = "schedule-row";
  
          var hoursSpacer = document.createElement("span");
          hoursSpacer.className = "schedule-user";
          hoursRow.appendChild(hoursSpacer);
  
          var hours = document.createElement("div");
  
          if (isHalfhour) {
              hours.className = "space-around"
              for (var i = time; i < maxHours + time; i++) {
                  var hour = document.createElement("span");
                  hour.innerHTML = this.getMilitaryTime(i);
                  hours.appendChild(hour);
              }
          } else {
              hours.className = "space-between"
              for (var i = time; i <= maxHours + time; i++) {
                  var hour = document.createElement("span");
                  hour.innerHTML = this.getMilitaryTime(i);
                  hours.appendChild(hour);
              }
          }
  
          hoursRow.appendChild(hours);
          display.appendChild(hoursRow);
  
          for (i = 0; i < this.scheduleInfo.list.length; i++) {
              var row = this.renderScheduleRow(this.scheduleInfo.list[i].person, this.scheduleInfo.list[i].classes[this.scheduleInfo.day], time);
              display.appendChild(row);
          }
  
          return display;
      },
  
      scheduleUpdate: function(delay) {
          var nextLoad = this.config.updateInterval;
          if (typeof delay !== "undefined" && delay >= 0) {
              nextLoad = delay;
          }
  
          var self = this;
          setTimeout(function() {
              self.updateSchedule();
          }, nextLoad);
      },
  
      socketNotificationReceived: function(notification, payload) {
          if (notification === "ERROR") {
              Log.log(payload.message)
          }
          if (notification !== "UPDATE") {
              if (notification === "PERSON") {
                  var result = payload.message;
                  this.scheduleInfo.list.push(result)
              }
          }
          if (notification === "UPDATE") {
              Log.log('Updating Dom');
              this.loaded = true;
              this.updateDom(this.fadeSpeed);
          }
      },
  });